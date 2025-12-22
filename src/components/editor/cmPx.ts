export const DPI = 96

export const cmToPx = (cm: number) => (cm / 2.54) * DPI

export const pxToCm = (px: number) => (px / DPI) * 2.54
