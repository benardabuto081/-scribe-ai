import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/design-system';
import { StyleGuide } from '@/design-system/styleguide/StyleGuide';

it('renders the living style guide', { timeout: 30_000 }, () => {
  render(
    <TooltipProvider>
      <StyleGuide />
    </TooltipProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Design system');
});
