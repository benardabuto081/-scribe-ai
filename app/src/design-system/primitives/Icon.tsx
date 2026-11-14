import type { LucideIcon, LucideProps } from 'lucide-react';

export type IconProps = LucideProps & { icon: LucideIcon; label?: string };

/** Lucide wrapper. Decorative by default; pass `label` when the icon carries meaning alone. */
export function Icon({ icon: Glyph, label, size = 18, strokeWidth = 1.75, ...rest }: IconProps) {
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...rest}
    />
  );
}
