/**
 * Unit tests for animation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  ANIMATION_TIMING,
  EASING,
  buttonVariants,
  modalVariants,
  backdropVariants,
  bottomSheetVariants,
  validationIconVariants,
  toastVariants,
  confirmationContainerVariants,
  confirmationChildVariants,
  getTransition,
} from './animations';

describe('animations', () => {
  describe('ANIMATION_TIMING constants', () => {
    it('should have button timing values matching AC requirements', () => {
      expect(ANIMATION_TIMING.BUTTON_HOVER_DURATION).toBe(0.15);
      expect(ANIMATION_TIMING.BUTTON_ACTIVE_DURATION).toBe(0.1);
    });

    it('should have modal timing values matching AC requirements', () => {
      expect(ANIMATION_TIMING.MODAL_BACKDROP_DURATION).toBe(0.2);
      expect(ANIMATION_TIMING.MODAL_ENTRY_DURATION).toBe(0.25);
      expect(ANIMATION_TIMING.MODAL_EXIT_DURATION).toBe(0.2);
    });

    it('should have mobile bottom sheet timing matching AC requirements', () => {
      expect(ANIMATION_TIMING.BOTTOM_SHEET_DURATION).toBe(0.3);
    });

    it('should have form timing values matching AC requirements', () => {
      expect(ANIMATION_TIMING.INPUT_FOCUS_DURATION).toBe(0.15);
      expect(ANIMATION_TIMING.VALIDATION_ICON_DURATION).toBe(0.2);
      expect(ANIMATION_TIMING.VALIDATION_SHAKE_DURATION).toBe(0.4);
    });

    it('should have confirmation page timing matching AC requirements', () => {
      expect(ANIMATION_TIMING.CHECKMARK_DRAW_DURATION).toBe(0.6);
      expect(ANIMATION_TIMING.STAGGER_DELAY).toBe(0.05);
    });

    it('should have toast timing values matching AC requirements', () => {
      expect(ANIMATION_TIMING.TOAST_ENTRY_DURATION).toBe(0.3);
      expect(ANIMATION_TIMING.TOAST_AUTO_DISMISS).toBe(3000);
      expect(ANIMATION_TIMING.TOAST_EXIT_DURATION).toBe(0.2);
    });

    it('should have loading state timing matching AC requirements', () => {
      expect(ANIMATION_TIMING.SKELETON_LOOP_DURATION).toBe(1.5);
      expect(ANIMATION_TIMING.SPINNER_DELAY).toBe(0.5);
      expect(ANIMATION_TIMING.SPINNER_FADE_DURATION).toBe(0.3);
    });
  });

  describe('EASING constants', () => {
    it('should have easeOut values', () => {
      expect(EASING.easeOut).toEqual([0.22, 1, 0.36, 1]);
    });

    it('should have easeIn values', () => {
      expect(EASING.easeIn).toEqual([0.4, 0, 1, 1]);
    });

    it('should have bounce values', () => {
      expect(EASING.bounce).toEqual([0.68, -0.55, 0.265, 1.55]);
    });
  });

  describe('buttonVariants', () => {
    it('should have hover variant with scale 1.02', () => {
      expect(buttonVariants.hover).toEqual({
        scale: 1.02,
        transition: {
          duration: 0.15,
          ease: EASING.easeOut,
        },
      });
    });

    it('should have tap variant with scale 0.98', () => {
      expect(buttonVariants.tap).toEqual({
        scale: 0.98,
        transition: {
          duration: 0.1,
          ease: EASING.easeIn,
        },
      });
    });
  });

  describe('modalVariants', () => {
    it('should have hidden state with opacity 0, scale 0.95, y 20', () => {
      expect(modalVariants.hidden).toEqual({
        opacity: 0,
        scale: 0.95,
        y: 20,
      });
    });

    it('should have visible state with opacity 1, scale 1, y 0', () => {
      expect(modalVariants.visible).toMatchObject({
        opacity: 1,
        scale: 1,
        y: 0,
      });
    });

    it('should have exit state with opacity 0, scale 0.95', () => {
      expect(modalVariants.exit).toMatchObject({
        opacity: 0,
        scale: 0.95,
      });
    });
  });

  describe('backdropVariants', () => {
    it('should fade from opacity 0 to 1', () => {
      expect(backdropVariants.hidden).toEqual({ opacity: 0 });
      expect(backdropVariants.visible).toMatchObject({ opacity: 1 });
    });

    it('should have exit with opacity 0', () => {
      expect(backdropVariants.exit).toMatchObject({ opacity: 0 });
    });
  });

  describe('bottomSheetVariants', () => {
    it('should slide from bottom (y: 100%) to top (y: 0)', () => {
      expect(bottomSheetVariants.hidden).toEqual({ y: '100%' });
      expect(bottomSheetVariants.visible).toMatchObject({ y: 0 });
    });

    it('should slide back to bottom on exit', () => {
      expect(bottomSheetVariants.exit).toMatchObject({ y: '100%' });
    });
  });

  describe('validationIconVariants', () => {
    it('should have success variant with slide from right', () => {
      expect(validationIconVariants.success).toEqual({
        opacity: [0, 1],
        x: [10, 0],
        transition: { duration: 0.2 },
      });
    });

    it('should have error variant with shake animation', () => {
      expect(validationIconVariants.error).toEqual({
        opacity: [0, 1],
        x: [0, -5, 5, -3, 3, 0],
        transition: { duration: 0.4 },
      });
    });
  });

  describe('toastVariants', () => {
    it('should slide from top with opacity fade', () => {
      expect(toastVariants.hidden).toEqual({ y: -100, opacity: 0 });
      expect(toastVariants.visible).toMatchObject({ y: 0, opacity: 1 });
    });

    it('should fade out on exit', () => {
      expect(toastVariants.exit).toMatchObject({ opacity: 0 });
    });
  });

  describe('confirmationContainerVariants', () => {
    it('should have stagger children configuration', () => {
      expect(confirmationContainerVariants.visible).toMatchObject({
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
        },
      });
    });
  });

  describe('confirmationChildVariants', () => {
    it('should fade in and move up', () => {
      expect(confirmationChildVariants.hidden).toEqual({ opacity: 0, y: 10 });
      expect(confirmationChildVariants.visible).toMatchObject({
        opacity: 1,
        y: 0,
      });
    });
  });

  describe('getTransition', () => {
    it('should return instant transition when shouldReduceMotion is true', () => {
      const normalTransition = { duration: 0.3, ease: 'easeOut' };
      const result = getTransition(normalTransition, true);
      expect(result).toEqual({ duration: 0 });
    });

    it('should return normal transition when shouldReduceMotion is false', () => {
      const normalTransition = { duration: 0.3, ease: 'easeOut' };
      const result = getTransition(normalTransition, false);
      expect(result).toEqual(normalTransition);
    });

    it('should preserve all transition properties when not reducing motion', () => {
      const normalTransition = {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1,
      };
      const result = getTransition(normalTransition, false);
      expect(result).toEqual(normalTransition);
    });
  });

  describe('GPU-accelerated properties', () => {
    it('should only use transform properties (scale, x, y) in button variants', () => {
      const hoverKeys = Object.keys(buttonVariants.hover || {}).filter(
        (k) => k !== 'transition'
      );
      const tapKeys = Object.keys(buttonVariants.tap || {}).filter(
        (k) => k !== 'transition'
      );

      expect(hoverKeys).toEqual(['scale']);
      expect(tapKeys).toEqual(['scale']);
    });

    it('should only use GPU-accelerated properties in modal variants', () => {
      const allowedProps = ['opacity', 'scale', 'x', 'y', 'transition'];
      const hiddenKeys = Object.keys(modalVariants.hidden || {});
      const visibleKeys = Object.keys(modalVariants.visible || {});
      const exitKeys = Object.keys(modalVariants.exit || {});

      hiddenKeys.forEach((key) => {
        expect(allowedProps).toContain(key);
      });
      visibleKeys.forEach((key) => {
        expect(allowedProps).toContain(key);
      });
      exitKeys.forEach((key) => {
        expect(allowedProps).toContain(key);
      });
    });

    it('should only use GPU-accelerated properties in toast variants', () => {
      const allowedProps = ['opacity', 'y', 'transition'];
      const hiddenKeys = Object.keys(toastVariants.hidden || {});
      const visibleKeys = Object.keys(toastVariants.visible || {});
      const exitKeys = Object.keys(toastVariants.exit || {});

      hiddenKeys.forEach((key) => {
        expect(allowedProps).toContain(key);
      });
      visibleKeys.forEach((key) => {
        expect(allowedProps).toContain(key);
      });
      exitKeys.forEach((key) => {
        expect(allowedProps).toContain(key);
      });
    });
  });
});
