import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Card, CardContent, CircularProgress, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Event, EventDetail, Person } from '../db';
import { getEventDetailsByEvent, getEvents, getPersons } from '../db';

const DEFAULT_PADDING = 12;
const INNER_MARGIN = 10;
const DEFAULT_CHART_WIDTH = 320;
const DEFAULT_CHART_HEIGHT = 150;
const MIN_CHART_HEIGHT = 200;

type StatRow = {
  label: string;
  value: number;
  secondary?: string;
  avatarUrl?: string;
};

type ContributionRow = StatRow & {
  food: number;
  drink: number;
};

type MiniLineChartProps = {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
  labels?: string[];
};

type MiniBarChartProps = {
  data: { label: string; value: number }[];
  height?: number;
  width?: number;
};

const MiniLineChart = ({ values, color, height = DEFAULT_CHART_HEIGHT, width = DEFAULT_CHART_WIDTH, labels }: MiniLineChartProps) => {
  const theme = useTheme();
  const stroke = color || theme.palette.primary.main;
  const viewHeight = Math.max(height ?? DEFAULT_CHART_HEIGHT, MIN_CHART_HEIGHT);
  if (!values.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: viewHeight }}>
        <Typography variant="body2" color="text.secondary">
          No data yet
        </Typography>
      </Box>
    );
  }

  const pad = DEFAULT_PADDING + INNER_MARGIN;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const verticalRange = max - min || 1;
  const hasMultiple = values.length > 1;
  const xStep = hasMultiple ? (width - pad * 2) / (values.length - 1) : 0;
  const yScale = (viewHeight - pad * 2) / verticalRange;

  const points = values.map((value, index) => {
    const x = pad + index * xStep;
    const y = viewHeight - pad - (value - min) * yScale;
    return { x, y };
  });

  const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const lastPoint = points[points.length - 1];

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: viewHeight }}>
      <svg
        viewBox={`0 0 ${width} ${viewHeight}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label="trend line"
      >
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        />
        <path d={path} fill="none" stroke="transparent" />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r={4} fill={stroke} opacity={idx === points.length - 1 ? 1 : 0.45} />
        ))}
        {labels &&
          labels.map((label, idx) => (
            <text
              key={`label-${idx}`}
              x={points[idx]?.x}
              y={viewHeight - INNER_MARGIN}
              fill={theme.palette.text.secondary}
              fontSize={11}
              textAnchor="middle"
            >
              {label}
            </text>
          ))}
        {lastPoint && (
          <text x={lastPoint.x + 6} y={lastPoint.y - 6} fill={theme.palette.text.primary} fontSize={12}>
            {values[values.length - 1]}
          </text>
        )}
      </svg>
    </Box>
  );
};

const MiniBarChart = ({ data, height = DEFAULT_CHART_HEIGHT, width = DEFAULT_CHART_WIDTH }: MiniBarChartProps) => {
  const theme = useTheme();
  const viewHeight = Math.max(height ?? DEFAULT_CHART_HEIGHT, MIN_CHART_HEIGHT);
  const pad = DEFAULT_PADDING + INNER_MARGIN;
  if (!data.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: viewHeight }}>
        <Typography variant="body2" color="text.secondary">
          No data yet
        </Typography>
      </Box>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values) || 1;
  const barWidth = (width - pad * 2) / data.length;
  const colorPool = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: viewHeight }}>
      <svg
        viewBox={`0 0 ${width} ${viewHeight}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label="bar chart"
      >
        {data.map((item, idx) => {
          const barHeight = (item.value / max) * (viewHeight - pad * 2);
          const x = pad + idx * barWidth;
          const y = viewHeight - pad - barHeight;
          const fill = colorPool[idx % colorPool.length];
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={Math.max(barWidth * 0.7, 12)} height={barHeight} fill={fill} rx={4} />
              <text x={x + barWidth * 0.35} y={y - 6} fill={theme.palette.text.primary} fontSize={12} textAnchor="middle">
                {item.value}
              </text>
              <text
                x={x + barWidth * 0.35}
                y={viewHeight - pad + 12}
                fill={theme.palette.text.secondary}
                fontSize={11}
                textAnchor="middle"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

const ContributionBarChart = ({ data }: { data: ContributionRow[] }) => {
  const theme = useTheme();
  const height = DEFAULT_CHART_HEIGHT + 40;
  const viewHeight = Math.max(height, MIN_CHART_HEIGHT + 40);
  const pad = DEFAULT_PADDING + INNER_MARGIN;
  const subset = data.slice(0, 8);
  if (!subset.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: viewHeight }}>
        <Typography variant="body2" color="text.secondary">
          No contributions recorded.
        </Typography>
      </Box>
    );
  }

  const maxValue = Math.max(...subset.map((d) => Math.max(d.food, d.drink, d.value)), 1);
  const width = DEFAULT_CHART_WIDTH + 40;
  const groupWidth = (width - pad * 2) / subset.length;
  const foodColor = theme.palette.success.main;
  const drinkColor = theme.palette.info.main;

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: viewHeight }}>
      <svg viewBox={`0 0 ${width} ${viewHeight}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }} role="img" aria-label="contribution chart">
        {subset.map((item, idx) => {
          const foodHeight = (item.food / maxValue) * (viewHeight - pad * 2);
          const drinkHeight = (item.drink / maxValue) * (viewHeight - pad * 2);
          const baseX = pad + idx * groupWidth;
          const barWidth = Math.max(groupWidth * 0.28, 12);
          const gap = Math.min(groupWidth * 0.1, 12);
          const foodX = baseX + groupWidth * 0.1;
          const drinkX = foodX + barWidth + gap;
          const foodY = viewHeight - pad - foodHeight;
          const drinkY = viewHeight - pad - drinkHeight;
          return (
            <g key={item.label}>
              <rect x={foodX} y={foodY} width={barWidth} height={foodHeight} fill={foodColor} rx={4} />
              <rect x={drinkX} y={drinkY} width={barWidth} height={drinkHeight} fill={drinkColor} rx={4} />
              <text x={foodX + barWidth / 2} y={foodY - 6} fill={theme.palette.text.primary} fontSize={12} textAnchor="middle">
                {item.food}
              </text>
              <text x={drinkX + barWidth / 2} y={drinkY - 6} fill={theme.palette.text.primary} fontSize={12} textAnchor="middle">
                {item.drink}
              </text>
              <text x={baseX + groupWidth * 0.5} y={viewHeight - pad + 14} fill={theme.palette.text.secondary} fontSize={11} textAnchor="middle">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <Stack direction="row" spacing={2} mt={1} alignItems="center" sx={{ color: 'text.secondary' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: foodColor }} />
          <Typography variant="caption">Food buys</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: drinkColor }} />
          <Typography variant="caption">Drink buys</Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

const TopTable = ({ title, rows, valueLabel }: { title: string; rows: StatRow[]; valueLabel: string }) => {
  const topRows = rows.slice(0, 8);
  return (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      <Typography variant="h6">{title}</Typography>
      {!topRows.length ? (
        <Typography variant="body2" color="text.secondary">
          Nothing to show yet.
        </Typography>
      ) : (
        <Table size="small" aria-label={`${title} table`}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">{valueLabel}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topRows.map((row) => (
              <TableRow key={row.label} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {row.avatarUrl && (
                      <Avatar src={row.avatarUrl} sx={{ width: 32, height: 32 }} alt={row.label}>
                        {row.label.charAt(0)}
                      </Avatar>
                    )}
                    <Stack spacing={0.25}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.label}
                      </Typography>
                      {row.secondary && (
                        <Typography variant="caption" color="text.secondary">
                          {row.secondary}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {rows.length > topRows.length && (
        <Typography variant="caption" color="text.secondary">
          Showing top {topRows.length} of {rows.length} entries
        </Typography>
      )}
    </Stack>
  );
};

const Dashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [detailsByEvent, setDetailsByEvent] = useState<Record<number, EventDetail[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [evts, prs] = await Promise.all([getEvents(), getPersons()]);
        if (!active) return;
        setEvents(evts);
        setPersons(prs);

        const detailPairs = await Promise.all(
          evts
            .filter((evt) => evt.id != null)
            .map(async (evt) => {
              const detailList = await getEventDetailsByEvent(evt.id as number);
              return [evt.id as number, detailList] as const;
            })
        );
        if (!active) return;
        const map: Record<number, EventDetail[]> = {};
        detailPairs.forEach(([id, list]) => {
          map[id] = list;
        });
        setDetailsByEvent(map);
      } catch (err) {
        console.error('Could not load dashboard data', err);
        if (active) setError('Could not load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const personById = useMemo(() => {
    const map = new Map<number, Person>();
    persons.forEach((p) => {
      if (p.id != null) map.set(p.id, p);
    });
    return map;
  }, [persons]);

  const attendanceRows = useMemo<StatRow[]>(() => {
    const counts = new Map<number, number>();
    events.forEach((evt) => {
      const evtId = evt.id;
      if (evtId == null) return;
      const detail = detailsByEvent[evtId] || [];
      detail.forEach((d: any) => {
        const pid = d.person_id as number | undefined;
        if (pid == null) return;
        counts.set(pid, (counts.get(pid) || 0) + 1);
      });
    });
    const rows: StatRow[] = [];
    counts.forEach((value, personId) => {
      const person = personById.get(personId);
      rows.push({
        label: person?.name || 'Unknown person',
        value,
        secondary: person?.alias,
        avatarUrl: person?.photo
      });
    });
    return rows.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  }, [detailsByEvent, events, personById]);

  const locationRows = useMemo<StatRow[]>(() => {
    const counts = new Map<string, number>();
    events.forEach((evt) => {
      const key = (evt.location || 'Unspecified').trim() || 'Unspecified';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const rows: StatRow[] = [];
    counts.forEach((value, label) => {
      rows.push({ label, value });
    });
    return rows.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  }, [events]);

  const asadorRows = useMemo<StatRow[]>(() => {
    const counts = new Map<number, number>();
    events.forEach((evt: any) => {
      const aid = evt.asador_id as number | undefined;
      if (aid == null) return;
      counts.set(aid, (counts.get(aid) || 0) + 1);
    });
    const rows: StatRow[] = [];
    counts.forEach((value, personId) => {
      const person = personById.get(personId);
      rows.push({
        label: person?.name || 'Unknown asador',
        value,
        secondary: person?.alias,
        avatarUrl: person?.photo
      });
    });
    return rows.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  }, [events, personById]);

  const contributionRows = useMemo<ContributionRow[]>(() => {
    const counts = new Map<number, { food: number; drink: number }>();
    Object.values(detailsByEvent).forEach((list) => {
      list.forEach((detail: any) => {
        const pid = detail.person_id as number | undefined;
        if (pid == null) return;
        const spentFood = (detail.food_cost ?? 0) > 0 || detail.include_food;
        const spentDrink = (detail.drink_cost ?? 0) > 0 || detail.include_drink;
        if (!spentFood && !spentDrink) return;
        const current = counts.get(pid) || { food: 0, drink: 0 };
        if (spentFood) current.food += 1;
        if (spentDrink) current.drink += 1;
        counts.set(pid, current);
      });
    });

    const rows: ContributionRow[] = [];
    counts.forEach(({ food, drink }, personId) => {
      const person = personById.get(personId);
      rows.push({
        label: person?.name || 'Unknown person',
        value: food + drink,
        food,
        drink,
        secondary: person?.alias,
        avatarUrl: person?.photo
      });
    });

    return rows.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  }, [detailsByEvent, personById]);

  const attendanceSeries = useMemo(() => {
    return [...events]
      .filter((evt) => evt.id != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((evt) => {
        const detail = detailsByEvent[evt.id as number] || [];
        return detail.length || (evt as any).attendee_count || 0;
      });
  }, [detailsByEvent, events]);
  const attendanceLabels = useMemo(() => {
    return [...events]
      .filter((evt) => evt.id != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((evt) => {
        const date = new Date(evt.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      });
  }, [events]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h4">Dashboard</Typography>
        {loading && <CircularProgress size={18} />}
      </Stack>
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <TopTable title="Attendance by person" rows={attendanceRows} valueLabel="Events attended" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1} sx={{ height: '100%' }}>
                <Typography variant="h6">Attendance trend</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sorted by most active people; line shows the drop-off across the list.
                </Typography>
                <MiniLineChart values={attendanceSeries} labels={attendanceLabels} />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <TopTable title="Events by location" rows={locationRows} valueLabel="Event count" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1} sx={{ height: '100%' }}>
                <Typography variant="h6">Location spread</Typography>
                <Typography variant="body2" color="text.secondary">
                  Visualizes which venues appear most frequently.
                </Typography>
                <MiniBarChart data={locationRows.map((row) => ({ label: row.label, value: row.value }))} />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <TopTable title="Asador frequency" rows={asadorRows} valueLabel="Times selected" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1} sx={{ height: '100%' }}>
                <Typography variant="h6">Asador trend</Typography>
                <Typography variant="body2" color="text.secondary">
                  Shows how often each asador has been assigned.
                </Typography>
                <MiniBarChart data={asadorRows.map((row) => ({ label: row.label, value: row.value }))} />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <Stack spacing={1.5} sx={{ height: '100%' }}>
                <Typography variant="h6">Who brought supplies</Typography>
                {!contributionRows.length ? (
                  <Typography variant="body2" color="text.secondary">
                    No recorded food or drink purchases yet.
                  </Typography>
                ) : (
                  <Table size="small" aria-label="person contributions table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Food buys</TableCell>
                        <TableCell align="right">Drink buys</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contributionRows.slice(0, 8).map((row) => (
                        <TableRow key={row.label} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {row.avatarUrl && (
                                <Avatar src={row.avatarUrl} sx={{ width: 32, height: 32 }} alt={row.label}>
                                  {row.label.charAt(0)}
                                </Avatar>
                              )}
                              <Stack spacing={0.25}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {row.label}
                                </Typography>
                                {row.secondary && (
                                  <Typography variant="caption" color="text.secondary">
                                    {row.secondary}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{row.food}</TableCell>
                          <TableCell align="right">{row.drink}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {row.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {contributionRows.length > 8 && (
                  <Typography variant="caption" color="text.secondary">
                    Showing top 8 of {contributionRows.length} people
                  </Typography>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1} sx={{ height: '100%' }}>
                <Typography variant="h6">Contributions by person</Typography>
                <Typography variant="body2" color="text.secondary">
                  Counts food and drink purchases separately; sorted by total buys.
                </Typography>
                <ContributionBarChart data={contributionRows} />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Dashboard;
