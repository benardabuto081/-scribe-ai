import markUrl from '@/assets/brand/mark.png';
import lockupUrl from '@/assets/brand/logo.jpeg';
import { useTranslation } from 'react-i18next';
import { cn } from '../primitives/cn';

/**
 * Brand marks. TEMPORARY assets (see docs/FEATURE_STATUS.md): `mark.png` is cropped from logo.jpeg.
 * The full lockup uses the original JPEG with `mix-blend-mode: screen`, which drops its black
 * background on dark surfaces without altering the artwork. On light themes we fall back to mark + name.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <img
      src={markUrl}
      width={size}
      height={size}
      alt={t('app.name')}
      draggable={false}
      className={cn('shrink-0 select-none', className)}
    />
  );
}

export function LogoLockup({ height = 64, className }: { height?: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <>
      <img
        src={lockupUrl}
        alt={`${t('app.name')} — ${t('app.tagline')}`}
        draggable={false}
        style={{ height }}
        className={cn(
          'hidden w-auto mix-blend-screen select-none [[data-theme=dark]_&]:block [[data-theme=hc]_&]:block',
          className,
        )}
      />
      <span
        className={cn(
          'flex items-center gap-3 [[data-theme=dark]_&]:hidden [[data-theme=hc]_&]:hidden',
          className,
        )}
      >
        <LogoMark size={height * 0.8} />
        <span className="flex flex-col">
          <span className="font-display text-2xl font-semibold tracking-wide text-fg">{t('app.name')}</span>
          <span className="text-xs tracking-[0.2em] text-fg-muted uppercase">{t('app.tagline')}</span>
        </span>
      </span>
    </>
  );
}
