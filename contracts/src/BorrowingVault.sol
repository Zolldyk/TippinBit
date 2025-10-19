// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title BorrowingVault
 * @notice Manages BTC-collateralized MUSD borrowing for TippinBit application
 * @dev Implements a simplified CDP (Collateralized Debt Position) system
 *
 * Flow:
 * 1. User deposits BTC as collateral
 * 2. System mints MUSD against the collateral
 * 3. User can execute tips (send MUSD to recipients)
 * 4. System tracks positions for collateral management
 */
contract BorrowingVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice BTC token contract (wrapped BTC on Mezo)
    IERC20 public immutable btcToken;

    /// @notice MUSD token contract (stablecoin)
    IERC20 public immutable musdToken;

    /// @notice Minimum collateralization ratio (215.25% = 21525 / 10000)
    uint256 public constant MIN_COLLATERAL_RATIO = 21525; // 215.25%
    uint256 public constant RATIO_PRECISION = 10000;

    /// @notice Position counter for generating unique IDs
    uint256 private _positionCounter;

    /// @notice Mapping of position ID to Position struct
    mapping(uint256 => Position) public positions;

    /// @notice Mapping of user address to their position IDs
    mapping(address => uint256[]) public userPositions;

    // ============ Structs ============

    struct Position {
        address owner;
        uint256 btcCollateral;      // Amount of BTC locked
        uint256 musdBorrowed;        // Amount of MUSD minted/borrowed
        uint256 createdAt;
        bool active;
    }

    // ============ Events ============

    event PositionCreated(
        uint256 indexed positionId,
        address indexed owner,
        uint256 btcCollateral,
        uint256 musdBorrowed
    );

    event TipExecuted(
        uint256 indexed positionId,
        address indexed recipient,
        uint256 amount,
        string message
    );

    event PositionClosed(
        uint256 indexed positionId,
        address indexed owner,
        uint256 btcReturned
    );

    // ============ Errors ============

    error InsufficientCollateral();
    error PositionNotFound();
    error NotPositionOwner();
    error PositionAlreadyClosed();
    error InsufficientMUSDBalance();
    error TransferFailed();

    // ============ Constructor ============

    constructor(address _btcToken, address _musdToken) Ownable(msg.sender) {
        require(_btcToken != address(0), "Invalid BTC token address");
        require(_musdToken != address(0), "Invalid MUSD token address");

        btcToken = IERC20(_btcToken);
        musdToken = IERC20(_musdToken);
    }

    // ============ External Functions ============

    /**
     * @notice Deposit BTC collateral and borrow MUSD
     * @dev User must approve this contract to spend BTC first
     * @param btcAmount Amount of BTC to deposit as collateral
     * @param musdAmount Amount of MUSD to borrow
     * @return positionId Unique ID for the created position
     */
    function depositCollateral(
        uint256 btcAmount,
        uint256 musdAmount
    ) external nonReentrant returns (uint256 positionId) {
        require(btcAmount > 0, "BTC amount must be > 0");
        require(musdAmount > 0, "MUSD amount must be > 0");

        // Check collateralization ratio
        // btcAmount / musdAmount must be >= MIN_COLLATERAL_RATIO / RATIO_PRECISION
        uint256 ratio = (btcAmount * RATIO_PRECISION) / musdAmount;
        if (ratio < MIN_COLLATERAL_RATIO) {
            revert InsufficientCollateral();
        }

        // Transfer BTC collateral from user
        btcToken.safeTransferFrom(msg.sender, address(this), btcAmount);

        // Mint/transfer MUSD to this contract (to be sent during tip execution)
        // Note: In production, this would mint new MUSD. For testnet, we assume MUSD exists.
        require(musdToken.balanceOf(address(this)) >= musdAmount, "Insufficient MUSD in vault");

        // Create position
        positionId = ++_positionCounter;

        positions[positionId] = Position({
            owner: msg.sender,
            btcCollateral: btcAmount,
            musdBorrowed: musdAmount,
            createdAt: block.timestamp,
            active: true
        });

        userPositions[msg.sender].push(positionId);

        emit PositionCreated(positionId, msg.sender, btcAmount, musdAmount);
    }

    /**
     * @notice Execute tip by sending MUSD to recipient and closing position
     * @dev This combines the tip execution and position closure in one transaction
     * @param positionId ID of the position to use
     * @param recipient Address to receive the MUSD tip
     * @param message Optional message for the tip
     * @return success Whether the tip was executed successfully
     */
    function executeTip(
        uint256 positionId,
        address recipient,
        string calldata message
    ) external nonReentrant returns (bool success) {
        Position storage position = positions[positionId];

        // Validate position
        if (position.owner == address(0)) revert PositionNotFound();
        if (position.owner != msg.sender) revert NotPositionOwner();
        if (!position.active) revert PositionAlreadyClosed();

        uint256 tipAmount = position.musdBorrowed;
        uint256 collateralToReturn = position.btcCollateral;

        // Mark position as closed
        position.active = false;

        // Transfer MUSD to recipient (the actual tip)
        musdToken.safeTransfer(recipient, tipAmount);

        // Return BTC collateral to user
        btcToken.safeTransfer(msg.sender, collateralToReturn);

        emit TipExecuted(positionId, recipient, tipAmount, message);
        emit PositionClosed(positionId, msg.sender, collateralToReturn);

        return true;
    }

    /**
     * @notice Close position and return collateral without executing tip
     * @dev Allows user to cancel and get their collateral back
     * @param positionId ID of the position to close
     * @return success Whether the position was closed successfully
     */
    function closePosition(uint256 positionId) external nonReentrant returns (bool success) {
        Position storage position = positions[positionId];

        // Validate position
        if (position.owner == address(0)) revert PositionNotFound();
        if (position.owner != msg.sender) revert NotPositionOwner();
        if (!position.active) revert PositionAlreadyClosed();

        uint256 collateralToReturn = position.btcCollateral;

        // Mark position as closed
        position.active = false;

        // Return BTC collateral to user
        btcToken.safeTransfer(msg.sender, collateralToReturn);

        // MUSD remains in vault (user never received it, so nothing to return from user)
        // In production with actual minting, this would burn the MUSD

        emit PositionClosed(positionId, msg.sender, collateralToReturn);

        return true;
    }

    // ============ View Functions ============

    /**
     * @notice Get position details
     * @param positionId ID of the position
     * @return owner Owner of the position
     * @return btcCollateral Amount of BTC collateral
     * @return musdBorrowed Amount of MUSD borrowed
     * @return createdAt Timestamp when position was created
     * @return active Whether position is still active
     */
    function getPosition(uint256 positionId) external view returns (
        address owner,
        uint256 btcCollateral,
        uint256 musdBorrowed,
        uint256 createdAt,
        bool active
    ) {
        Position memory position = positions[positionId];
        return (
            position.owner,
            position.btcCollateral,
            position.musdBorrowed,
            position.createdAt,
            position.active
        );
    }

    /**
     * @notice Get all position IDs for a user
     * @param user Address of the user
     * @return Array of position IDs
     */
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    /**
     * @notice Get current position counter
     * @return Current position counter value
     */
    function getPositionCounter() external view returns (uint256) {
        return _positionCounter;
    }

    // ============ Owner Functions ============

    /**
     * @notice Fund the vault with MUSD (for testnet)
     * @dev In production, contract would mint MUSD. For testnet, owner funds it.
     * @param amount Amount of MUSD to fund
     */
    function fundVault(uint256 amount) external onlyOwner {
        musdToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Emergency withdraw (owner only, for testnet safety)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
