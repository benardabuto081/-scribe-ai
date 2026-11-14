import { act, fireEvent, render } from '@testing-library/react';
import { CommandPalette, type PaletteItem } from './CommandPalette';

const items: PaletteItem[] = [
  { id: 'app.toggleInspector', label: 'Toggle inspector', group: 'App' },
  { id: 'pl:pl-sunday', label: 'Select playlist: Sunday Service', group: 'Playlist' },
  { id: 'nav:/screens', label: 'Screens', group: 'Go to', boost: 0.05 },
  { id: 'nav:/live', label: 'Live', group: 'Go to', boost: 0.05 },
  { id: 'song:p-amazing-grace', label: 'Load song: Amazing Grace', group: 'Songs' },
];

function selectedAfterTyping(query: string): string {
  const { unmount } = render(
    <CommandPalette open onOpenChange={() => undefined} items={items} onRun={() => undefined} />,
  );
  const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
  if (!input) throw new Error('no input');
  act(() => {
    fireEvent.change(input, { target: { value: query } });
  });
  const label = document.querySelector('[cmdk-item][data-selected="true"]')?.textContent?.trim() ?? '';
  unmount();
  return label;
}

describe('CommandPalette ranking (rendered)', () => {
  it.each([
    ['live', 'Live'],
    ['screens', 'Screens'],
    ['amazing', 'Load song: Amazing Grace'],
  ])('"%s" selects "%s" first', (query, expected) => {
    expect(selectedAfterTyping(query)).toContain(expected);
  });
});
