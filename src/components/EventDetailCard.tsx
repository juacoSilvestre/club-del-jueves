import { useMemo } from 'react';
import {
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { Event, EventDetail, Person } from '../db';

export type EventDetailCardProps = {
  event: Event;
  details: EventDetail[];
  persons: Person[];
};

function EventDetailCard({ event, details, persons }: EventDetailCardProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error('Could not copy', err);
    }
  };

  const personById = useMemo(() => {
    const map = new Map<number, Person>();
    persons.forEach((p) => {
      if (p.id != null) map.set(p.id, p);
    });
    return map;
  }, [persons]);

  const personPhotoByName = useMemo(() => {
    const map = new Map<string, string | undefined>();
    persons.forEach((p) => {
      if (p.name) map.set(p.name, p.photo);
    });
    return map;
  }, [persons]);

  const attendees = useMemo(() => {
    return details.map((detail) => {
      const person = detail.personId != null ? personById.get(detail.personId) : undefined;
      const foodCost = detail.includeFood === false ? 0 : detail.foodCost ?? 0;
      const drinkCost = detail.includeDrink === false ? 0 : detail.drinkCost ?? 0;
      return {
        id: detail.id ?? `${detail.eventId}-${detail.personId}`,
        personId: detail.personId,
        name: person?.name ?? 'Unknown person',
        alias: person?.alias,
        note: detail.note || '',
        foodCost,
        drinkCost,
        totalPaid: foodCost + drinkCost,
        includeFood: detail.includeFood !== false,
        includeDrink: detail.includeDrink !== false
      };
    });
  }, [details, personById]);

  const splitInfo = useMemo(() => {
    const foodPeople = attendees.filter((a) => a.includeFood);
    const drinkPeople = attendees.filter((a) => a.includeDrink);
    const bothPeople = attendees.filter((a) => a.includeFood && a.includeDrink);

    const totalFood = attendees.reduce((sum, a) => sum + (a.includeFood ? a.foodCost : 0), 0);
    const totalDrink = attendees.reduce((sum, a) => sum + (a.includeDrink ? a.drinkCost : 0), 0);

    const foodShare = foodPeople.length ? totalFood / foodPeople.length : 0;
    const drinkShare = drinkPeople.length ? totalDrink / drinkPeople.length : 0;
    const bothShare = bothPeople.length ? foodShare + drinkShare : 0;

    return {
      foodShare,
      drinkShare,
      bothShare,
      foodPeople: foodPeople.length,
      drinkPeople: drinkPeople.length,
      bothPeople: bothPeople.length
    };
  }, [attendees]);

  const settlements = useMemo(() => {
    if (attendees.length === 0)
      return { share: 0, transfers: [] as Array<{ from: string; to: string; fromAlias?: string; toAlias?: string; amount: number }> }; // nothing to settle

    const paidCents = attendees.map((a) => Math.round(a.totalPaid * 100));

    const totalFoodCents = attendees.reduce(
      (sum, a) => sum + (a.includeFood ? Math.round(a.foodCost * 100) : 0),
      0
    );
    const totalDrinkCents = attendees.reduce(
      (sum, a) => sum + (a.includeDrink ? Math.round(a.drinkCost * 100) : 0),
      0
    );

    const foodCount = attendees.filter((a) => a.includeFood).length;
    const drinkCount = attendees.filter((a) => a.includeDrink).length;

    const foodBase = foodCount ? Math.floor(totalFoodCents / foodCount) : 0;
    const foodRem = foodCount ? totalFoodCents % foodCount : 0;
    const drinkBase = drinkCount ? Math.floor(totalDrinkCents / drinkCount) : 0;
    const drinkRem = drinkCount ? totalDrinkCents % drinkCount : 0;

    let foodIdx = 0;
    let drinkIdx = 0;
    const targets = attendees.map((a) => {
      let target = 0;
      if (a.includeFood) {
        target += foodBase + (foodIdx < foodRem ? 1 : 0);
        foodIdx += 1;
      }
      if (a.includeDrink) {
        target += drinkBase + (drinkIdx < drinkRem ? 1 : 0);
        drinkIdx += 1;
      }
      return target;
    });

    const totalTargets = targets.reduce((sum, v) => sum + v, 0);
    const shareDisplay = totalTargets / attendees.length / 100;

    type Balance = { name: string; alias?: string; cents: number };
    const debtors: Balance[] = [];
    const creditors: Balance[] = [];

    attendees.forEach((a, idx) => {
      const netCents = paidCents[idx] - targets[idx];
      if (netCents === 0) return;
      if (netCents < 0) {
        debtors.push({ name: a.name, alias: a.alias, cents: -netCents });
      } else {
        creditors.push({ name: a.name, alias: a.alias, cents: netCents });
      }
    });

    debtors.sort((a, b) => b.cents - a.cents);
    creditors.sort((a, b) => b.cents - a.cents);

    const transfers: Array<{ from: string; to: string; fromAlias?: string; toAlias?: string; amount: number }> = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const payCents = Math.min(debtors[i].cents, creditors[j].cents);
      transfers.push({
        from: debtors[i].name,
        to: creditors[j].name,
        fromAlias: debtors[i].alias,
        toAlias: creditors[j].alias,
        amount: payCents / 100
      });
      debtors[i].cents -= payCents;
      creditors[j].cents -= payCents;
      if (debtors[i].cents === 0) i += 1;
      if (creditors[j].cents === 0) j += 1;
    }

    return { share: +shareDisplay.toFixed(2), transfers };
  }, [attendees]);

  const asadorName = useMemo(() => {
    if (!event.asadorId) return null;
    const p = persons.find((person) => person.id === event.asadorId);
    return p?.name || null;
  }, [event.asadorId, persons]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Stack spacing={0.5}>
              <Typography variant="h6">{event.name || 'Event'} on {event.date}</Typography>
              <Typography variant="body2" color="text.secondary">
                {event.attendeeCount} attendee{event.attendeeCount === 1 ? '' : 's'}{event.location ? ` · ${event.location}` : ''}
              </Typography>
              {asadorName && (
                <Typography variant="body2" color="text.secondary">
                  Asador: {asadorName}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Food: ${formatCurrency(event.totalFoodCost)}`} size="small" />
              <Chip label={`Drinks: ${formatCurrency(event.totalDrinkCost)}`} size="small" />
            </Stack>
          </Stack>

          <Divider />

          {attendees.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No attendees recorded for this event.
            </Typography>
          ) : (
            <List dense>
              {attendees.map((attendee) => (
                <ListItem key={attendee.id} disableGutters>
                  <ListItemText
                    primary={attendee.name + (attendee.alias ? ` (${attendee.alias})` : '')}
                    secondary={
                      attendee.note ||
                      [
                        attendee.foodCost != null ? `Food: ${formatCurrency(attendee.foodCost)}` : null,
                        attendee.drinkCost != null ? `Drinks: ${formatCurrency(attendee.drinkCost)}` : null
                      ]
                        .filter(Boolean)
                        .join(' · ') ||
                      undefined
                    }
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Checkbox size="small" checked={attendee.includeFood} disabled />
                      <Typography variant="body2">Food</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Checkbox size="small" checked={attendee.includeDrink} disabled />
                      <Typography variant="body2">Drinks</Typography>
                    </Stack>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}

          <Divider />

          {attendees.length === 0 ? null : (
            <Stack spacing={1}>
              <Typography variant="subtitle1">Settlements</Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Equal split (food only): {splitInfo.foodPeople ? formatCurrency(splitInfo.foodShare) : '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Equal split (drinks only): {splitInfo.drinkPeople ? formatCurrency(splitInfo.drinkShare) : '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Equal split (both): {splitInfo.bothPeople ? formatCurrency(splitInfo.bothShare) : '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall equal split per person: {formatCurrency(settlements.share)}
                </Typography>
              </Stack>
              {settlements.transfers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  All settled. No transfers needed.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Alias</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settlements.transfers.map((t, idx) => (
                      <TableRow key={`${t.from}-${t.to}-${idx}`}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar src={personPhotoByName.get(t.from)} sx={{ width: 32, height: 32 }} alt={t.from}>
                              {t.from.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{t.from}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar src={personPhotoByName.get(t.to)} sx={{ width: 32, height: 32 }} alt={t.to}>
                              {t.to.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{t.to}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {t.toAlias && (
                              <Typography variant="body2" color="text.secondary">
                                {t.toAlias}
                              </Typography>
                            )}
                            {t.toAlias && (
                              <Tooltip title="Copy alias">
                                <IconButton size="small" onClick={() => copyText(t.toAlias || '')}>
                                  <ContentCopyIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}

                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                            <Typography>{formatCurrency(t.amount)}</Typography>
                            <Tooltip title="Copy amount">
                              <IconButton size="small" onClick={() => copyText(t.amount.toFixed(2))}>
                                <ContentCopyIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default EventDetailCard;
