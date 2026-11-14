import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BookOpen,
  Copy,
  Folder,
  Library,
  Music,
  Pencil,
  Play,
  Plus,
  Radio,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  ColorPicker,
  CommandPalette,
  ComingSoon,
  ContextMenu,
  Dialog,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FontPicker,
  GradientEditor,
  IconButton,
  Input,
  Kbd,
  LoadingState,
  LogoLockup,
  LogoMark,
  Meter,
  Popover,
  Segmented,
  Select,
  ShortcutRecorder,
  Skeleton,
  Slider,
  Spinner,
  SplitPane,
  Switch,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThumbnailGrid,
  Timeline,
  Tree,
  toast,
  type Gradient,
  type SortState,
} from '@/design-system';
import { THEMES, DENSITIES, GROUP_COLORS } from '@/design-system/tokens/tokens';
import { useSettings } from '@/state/settings';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex flex-col gap-4 border-b border-line py-8">
      <h2 id={`${id}-h`} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

const SWATCH_TOKENS = [
  'canvas',
  'surface-1',
  'surface-2',
  'surface-3',
  'surface-4',
  'line-strong',
  'fg',
  'fg-muted',
  'fg-subtle',
  'accent',
  'accent-soft',
  'focus',
  'success',
  'warn',
  'danger',
  'info',
  'live',
  'ai-listening',
  'ai-proposing',
  'ai-acting',
  'ai-paused',
] as const;

type DemoRow = { id: string; title: string; author: string; uses: number };
const DEMO_ROWS: DemoRow[] = Array.from({ length: 500 }, (_, i) => ({
  id: `r${i}`,
  title: `Demo row ${i + 1}`,
  author: ['A. Author', 'B. Writer', 'C. Composer'][i % 3] ?? '',
  uses: (i * 37) % 120,
}));

export function StyleGuide() {
  const { t } = useTranslation();
  const settings = useSettings();
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [seg, setSeg] = useState<'manual' | 'assist' | 'auto'>('assist');
  const [sw, setSw] = useState(true);
  const [slider, setSlider] = useState(62);
  const [color, setColor] = useState('#1f8bff');
  const [font, setFont] = useState('Inter Variable');
  const [shortcut, setShortcut] = useState<string | null>('Ctrl+Shift+B');
  const [gradient, setGradient] = useState<Gradient>({
    angle: 135,
    stops: [
      { color: '#1e40ff', at: 0 },
      { color: '#22d3ee', at: 100 },
    ],
  });
  const [sort, setSort] = useState<SortState>(null);
  const [treeSel, setTreeSel] = useState<string | null>('worship');
  const sortedRows = useMemo(() => {
    if (!sort) return DEMO_ROWS;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...DEMO_ROWS].sort((a, b) =>
      sort.key === 'uses' ? (a.uses - b.uses) * dir : a.title.localeCompare(b.title) * dir,
    );
  }, [sort]);

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-6xl px-8 pb-24">
        <header className="sticky top-0 z-10 -mx-8 flex flex-wrap items-center gap-4 border-b border-line bg-glass px-8 py-4 backdrop-blur-md">
          <LogoMark size={36} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{t('styleguide.title')}</h1>
            <p className="text-sm text-fg-muted">{t('styleguide.subtitle')}</p>
          </div>
          <Segmented
            label={t('settings.theme')}
            value={settings.theme}
            onChange={settings.setTheme}
            options={THEMES.map((th) => ({ value: th, label: t(`settings.themes.${th}`) }))}
          />
          <Segmented
            label={t('settings.density')}
            value={settings.density}
            onChange={settings.setDensity}
            options={DENSITIES.map((d) => ({ value: d, label: t(`settings.densities.${d}`) }))}
          />
        </header>

        <Section id="brand" title={t('styleguide.brand')}>
          <div className="flex flex-wrap items-center gap-8 rounded-xl border border-line bg-surface-1 p-6">
            <LogoLockup height={72} />
            <div className="flex items-center gap-3">
              <LogoMark size={48} />
              <LogoMark size={32} />
              <LogoMark size={20} />
            </div>
            <div className="h-16 w-64 rounded-lg bg-brand-gradient shadow-glow" />
          </div>
        </Section>

        <Section id="color" title={t('styleguide.color')}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {SWATCH_TOKENS.map((tok) => (
              <div key={tok} className="flex flex-col gap-1.5">
                <div
                  className="h-14 rounded-md border border-line"
                  style={{ background: `var(--sa-${tok})` }}
                />
                <code className="text-2xs text-fg-muted">{tok}</code>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GROUP_COLORS).map(([k, c]) => (
              <Chip key={k} color={c}>
                {t(`groups.${k}`)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section id="type" title={t('styleguide.typography')}>
          <div className="flex flex-col gap-2">
            <p className="font-display text-4xl font-semibold">{t('styleguide.sampleDisplay')}</p>
            <p className="font-display text-2xl font-semibold">{t('styleguide.sampleHeading')}</p>
            <p className="text-base">{t('styleguide.sampleBody')}</p>
            <p className="text-sm text-fg-muted">{t('styleguide.sampleBody')}</p>
            <p className="text-xs text-fg-subtle">{t('styleguide.sampleCaption')}</p>
          </div>
        </Section>

        <Section id="buttons" title={t('styleguide.buttons')}>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="brand" icon={Sparkles}>
              {t('styleguide.brandAction')}
            </Button>
            <Button variant="primary" icon={Plus}>
              {t('common.new')}
            </Button>
            <Button>{t('common.cancel')}</Button>
            <Button variant="outline" icon={Copy}>
              {t('common.duplicate')}
            </Button>
            <Button variant="ghost" icon={Pencil}>
              {t('common.rename')}
            </Button>
            <Button variant="danger" icon={Trash2}>
              {t('common.delete')}
            </Button>
            <Button variant="live" icon={Play} size="lg">
              {t('live.take')}
            </Button>
            <Button loading>{t('ds.loading')}</Button>
            <Button disabled>{t('common.disabled')}</Button>
          </div>
          <div className="flex items-center gap-1">
            <IconButton icon={Search} label={t('common.search')} shortcut="Ctrl+F" />
            <IconButton icon={Bell} label={t('common.notifications')} />
            <IconButton icon={Settings} label={t('nav.settings')} active />
            <IconButton icon={Radio} label={t('status.live')} variant="live" />
          </div>
        </Section>

        <Section id="inputs" title={t('styleguide.inputs')}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t('common.search')} hint={t('styleguide.hint')}>
              {(p) => <Input {...p} icon={Search} placeholder={t('styleguide.searchPlaceholder')} />}
            </Field>
            <Field label={t('styleguide.withError')} error={t('styleguide.errorText')}>
              {(p) => <Input {...p} defaultValue="Mat 3:16:99" />}
            </Field>
            <Field label={t('styleguide.select')}>
              {(p) => (
                <Select
                  id={p.id}
                  value="kjv"
                  onValueChange={() => undefined}
                  options={[
                    { value: 'kjv', label: 'KJV' },
                    { value: 'sw', label: 'Swahili Union (import)', disabled: true },
                  ]}
                />
              )}
            </Field>
            <Field label={t('styleguide.textarea')}>{(p) => <Textarea {...p} placeholder="…" />}</Field>
            <div className="flex items-center gap-3">
              <Switch checked={sw} onCheckedChange={setSw} label={t('styleguide.switch')} />
              <span className="text-sm">{t('styleguide.switch')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Slider label={t('styleguide.slider')} value={slider} onValueChange={setSlider} />
              <span className="w-10 text-sm tabular-nums">{slider}</span>
            </div>
            <Segmented
              label={t('ai.mode')}
              value={seg}
              onChange={setSeg}
              options={[
                { value: 'manual', label: t('ai.modes.manual') },
                { value: 'assist', label: t('ai.modes.assist') },
                { value: 'auto', label: t('ai.modes.auto') },
              ]}
            />
            <div className="flex items-center gap-2">
              <Kbd keys="Ctrl+K" />
              <Kbd keys="Space" />
              <Kbd keys="Shift+B" />
            </div>
          </div>
        </Section>

        <Section id="pickers" title={t('styleguide.pickers')}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-wrap items-center gap-3">
              <ColorPicker label={t('styleguide.color')} value={color} onChange={setColor} />
              <div className="w-48">
                <FontPicker label={t('styleguide.font')} value={font} onChange={setFont} />
              </div>
              <ShortcutRecorder label={t('styleguide.shortcut')} value={shortcut} onChange={setShortcut} />
            </div>
            <GradientEditor value={gradient} onChange={setGradient} />
          </div>
        </Section>

        <Section id="badges" title={t('styleguide.badges')}>
          <div className="flex flex-wrap gap-2">
            <Badge>{t('styleguide.neutral')}</Badge>
            <Badge tone="accent">{t('styleguide.accent')}</Badge>
            <Badge tone="success" dot>
              {t('status.engine.connected')}
            </Badge>
            <Badge tone="warn" dot>
              {t('status.engine.starting')}
            </Badge>
            <Badge tone="danger" dot>
              {t('status.engine.down')}
            </Badge>
            <Badge tone="info">{t('status.online')}</Badge>
            <Badge tone="live" icon={Radio}>
              {t('status.live')}
            </Badge>
            <Badge tone="ai" icon={Sparkles}>
              {t('ai.modes.assist')}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip selected>{t('styleguide.selected')}</Chip>
            <Chip onClick={() => undefined}>{t('styleguide.filter')}</Chip>
            <Chip onRemove={() => undefined} removeLabel={t('common.remove')} color={GROUP_COLORS.chorus}>
              {t('groups.chorus')}
            </Chip>
          </div>
          <div className="grid max-w-md gap-3">
            <Meter label={t('styleguide.meter')} value={0.72} />
            <Meter label={t('status.mic')} value={0.84} variant="segmented" />
          </div>
        </Section>

        <Section id="overlays" title={t('styleguide.overlays')}>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDialog(true)}>{t('styleguide.openDialog')}</Button>
            <Button onClick={() => setDrawer(true)}>{t('styleguide.openDrawer')}</Button>
            <Popover trigger={<Button>{t('styleguide.openPopover')}</Button>}>
              <p className="max-w-56 text-sm text-fg-muted">{t('styleguide.popoverBody')}</p>
            </Popover>
            <Button onClick={() => toast({ title: t('styleguide.toastTitle'), tone: 'success' })}>
              {t('styleguide.showToast')}
            </Button>
            <Button onClick={() => setPalette(true)} iconRight={undefined}>
              {t('styleguide.openPalette')}
            </Button>
            <ContextMenu
              items={[
                { label: t('common.rename'), icon: Pencil, shortcut: 'F2', onSelect: () => undefined },
                { label: t('common.duplicate'), icon: Copy, shortcut: 'Ctrl+D', onSelect: () => undefined },
                { type: 'separator' },
                { label: t('common.delete'), icon: Trash2, danger: true, onSelect: () => undefined },
              ]}
            >
              <div className="grid h-control place-items-center rounded-md border border-dashed border-line-strong px-4 text-sm text-fg-muted">
                {t('styleguide.rightClick')}
              </div>
            </ContextMenu>
          </div>
          <Dialog
            open={dialog}
            onOpenChange={setDialog}
            title={t('styleguide.dialogTitle')}
            description={t('styleguide.dialogBody')}
            footer={
              <>
                <Button onClick={() => setDialog(false)}>{t('common.cancel')}</Button>
                <Button variant="primary" onClick={() => setDialog(false)}>
                  {t('common.confirm')}
                </Button>
              </>
            }
          >
            <Field label={t('common.name')}>{(p) => <Input {...p} />}</Field>
          </Dialog>
          <Drawer open={drawer} onOpenChange={setDrawer} title={t('styleguide.drawerTitle')}>
            <p className="text-sm text-fg-muted">{t('styleguide.drawerBody')}</p>
          </Drawer>
          <CommandPalette
            open={palette}
            onOpenChange={setPalette}
            onRun={() => setPalette(false)}
            items={[
              {
                id: 'a',
                label: t('styleguide.paletteA'),
                group: t('nav.live'),
                icon: Play,
                shortcut: 'Space',
              },
              { id: 'b', label: t('styleguide.paletteB'), group: t('nav.library'), icon: Library },
              { id: 'c', label: t('styleguide.paletteC'), group: t('nav.songs'), icon: Music },
            ]}
          />
        </Section>

        <Section id="tabs" title={t('styleguide.tabs')}>
          <Tabs defaultValue="one">
            <TabsList>
              <TabsTrigger value="one" icon={BookOpen} count={3}>
                {t('nav.bible')}
              </TabsTrigger>
              <TabsTrigger value="two" icon={Music}>
                {t('nav.songs')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="one" className="py-4 text-sm text-fg-muted">
              {t('styleguide.tabOne')}
            </TabsContent>
            <TabsContent value="two" className="py-4 text-sm text-fg-muted">
              {t('styleguide.tabTwo')}
            </TabsContent>
          </Tabs>
        </Section>

        <Section id="data" title={t('styleguide.data')}>
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <Card className="p-2">
              <Tree
                label={t('nav.library')}
                selectedId={treeSel}
                onSelect={setTreeSel}
                defaultExpanded={['root']}
                nodes={[
                  {
                    id: 'root',
                    label: t('styleguide.allLibraries'),
                    icon: Folder,
                    children: [
                      {
                        id: 'worship',
                        label: t('styleguide.worship'),
                        icon: Folder,
                        count: 42,
                        color: GROUP_COLORS.chorus,
                      },
                      {
                        id: 'sermons',
                        label: t('styleguide.sermons'),
                        icon: Folder,
                        count: 18,
                        color: GROUP_COLORS.sermonPoint,
                      },
                    ],
                  },
                ]}
              />
            </Card>
            <Card className="h-72 overflow-hidden">
              <Table
                label={t('styleguide.data')}
                rows={sortedRows}
                rowKey={(r) => r.id}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { key: 'title', header: t('common.title'), cell: (r) => r.title, sortable: true },
                  { key: 'author', header: t('common.author'), cell: (r) => r.author, width: '160px' },
                  {
                    key: 'uses',
                    header: t('common.uses'),
                    cell: (r) => r.uses,
                    width: '90px',
                    align: 'right',
                    sortable: true,
                  },
                ]}
              />
            </Card>
          </div>
          <Card className="h-80 overflow-hidden">
            <ThumbnailGrid
              label={t('styleguide.thumbs')}
              items={Array.from({ length: 240 }, (_, i) => i)}
              itemKey={(i) => String(i)}
              minItemWidth={180}
              renderItem={(i) => (
                <div className="flex flex-col gap-1.5">
                  <div
                    className="aspect-video rounded-md border border-line"
                    style={{
                      background: `linear-gradient(${(i * 29) % 360}deg, var(--sa-brand-700), var(--sa-cyan-500))`,
                    }}
                  />
                  <span className="truncate text-xs text-fg-muted">
                    {t('styleguide.slide')} {i + 1}
                  </span>
                </div>
              )}
            />
          </Card>
          <Timeline
            label={t('styleguide.timeline')}
            duration={600}
            playhead={140}
            pxPerSecond={2.2}
            tracks={[
              {
                id: 't1',
                label: t('styleguide.slides'),
                clips: [
                  { id: 'c1', start: 0, duration: 120, label: t('groups.verse'), color: GROUP_COLORS.verse },
                  {
                    id: 'c2',
                    start: 120,
                    duration: 90,
                    label: t('groups.chorus'),
                    color: GROUP_COLORS.chorus,
                  },
                  {
                    id: 'c3',
                    start: 210,
                    duration: 150,
                    label: t('groups.bridge'),
                    color: GROUP_COLORS.bridge,
                  },
                ],
              },
              {
                id: 't2',
                label: t('styleguide.audio'),
                clips: [{ id: 'c4', start: 30, duration: 400, label: 'Pad loop', color: GROUP_COLORS.intro }],
              },
            ]}
          />
        </Section>

        <Section id="layout" title={t('styleguide.layout')}>
          <div className="h-56 overflow-hidden rounded-lg border border-line">
            <SplitPane
              id="styleguide-demo"
              panes={[
                { id: 'a', defaultSize: '30', minSize: '15', children: <Pane label="A" /> },
                { id: 'b', defaultSize: '45', children: <Pane label="B" /> },
                { id: 'c', defaultSize: '25', minSize: '15', children: <Pane label="C" /> },
              ]}
            />
          </div>
        </Section>

        <Section id="states" title={t('styleguide.states')}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <EmptyState
                icon={Music}
                title={t('styleguide.emptyTitle')}
                description={t('styleguide.emptyBody')}
                action={
                  <Button variant="primary" icon={Plus}>
                    {t('common.new')}
                  </Button>
                }
              />
            </Card>
            <Card>
              <ErrorState onRetry={() => undefined} />
            </Card>
            <Card>
              <LoadingState rows={3} />
            </Card>
            <Card>
              <CardHeader
                title={t('styleguide.populated')}
                icon={Sparkles}
                subtitle={t('styleguide.populatedSub')}
              />
              <CardBody className="flex flex-col gap-2">
                <Spinner />
                <Skeleton className="h-3 w-3/4" />
              </CardBody>
            </Card>
            <ComingSoon feature={t('nav.director')} phase="E" className="md:col-span-2" />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Pane({ label }: { label: string }) {
  return <div className="grid h-full place-items-center bg-surface-1 text-sm text-fg-muted">{label}</div>;
}
