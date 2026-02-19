import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
  MenuItem
} from '@mui/material';
import type { Event, EventDetail, Person } from '../db';
import { getEventDetailsByEvent, getEvents, getPersons, saveEvent, deleteEvent, deleteEventDetailsByEvent } from '../db';
import EventDetailCard from '../components/EventDetailCard';

function EventsHistory() {
  const [events, setEvents] = useState<Event[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [eventForm, setEventForm] = useState<{
    id?: number;
    name: string;
    location: string;
    date: string;
    asadorId: number | null;
    attendeeCount: number;
    totalFoodCost: number;
    totalDrinkCost: number;
  }>({ id: undefined, name: '', location: '', date: new Date().toISOString().split('T')[0], asadorId: null, attendeeCount: 0, totalFoodCost: 0, totalDrinkCost: 0 });

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
  }, [events]);

  const selectedEvent = useMemo(() => sortedEvents.find((e) => e.id === selectedId) || null, [sortedEvents, selectedId]);

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
        if (evts.length > 0) {
          const latest = [...evts].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))[0] as any;
          setSelectedId(latest.id ?? null);
          setEventForm({
            id: latest.id,
            name: latest.name || '',
            location: latest.location || '',
            date: latest.date,
            asadorId: latest.asador_id ?? null,
            attendeeCount: latest.attendee_count || 0,
            totalFoodCost: latest.total_food_cost || 0,
            totalDrinkCost: latest.total_drink_cost || 0
          });
        }
      } catch (e) {
        if (active) setError('Could not load events.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const evt = selectedEvent;
    if (!evt) return;
    const e: any = evt;
    setEventForm({
      id: e.id,
      name: e.name || '',
      location: e.location || '',
      date: e.date,
      asadorId: e.asador_id ?? null,
      attendeeCount: e.attendee_count || 0,
      totalFoodCost: e.total_food_cost || 0,
      totalDrinkCost: e.total_drink_cost || 0
    });
  }, [selectedEvent]);

  useEffect(() => {
    let active = true;
    if (!selectedId) {
      setDetails([]);
      return;
    }
    (async () => {
      setLoadingDetails(true);
      setError('');
      try {
        const det = await getEventDetailsByEvent(selectedId);
        if (active) setDetails(det);
      } catch (e) {
        if (active) setError('Could not load event details.');
      } finally {
        if (active) setLoadingDetails(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleField = (field: keyof typeof eventForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEventForm((prev) => ({
      ...prev,
      [field]: field === 'asadorId' ? (value ? Number(value) : null) : field === 'attendeeCount' || field === 'totalFoodCost' || field === 'totalDrinkCost' ? Number(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setEventForm({
      id: undefined,
      name: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      asadorId: null,
      attendeeCount: 0,
      totalFoodCost: 0,
      totalDrinkCost: 0
    });
    setSelectedId(null);
    setDetails([]);
  };

  const handleSave = async () => {
    if (!eventForm.name.trim()) {
      setError('Event name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveEvent({
        id: eventForm.id,
        name: eventForm.name.trim(),
        location: eventForm.location.trim() || undefined,
        asador_id: eventForm.asadorId ?? undefined,
        date: eventForm.date,
        attendee_count: eventForm.attendeeCount,
        total_food_cost: eventForm.totalFoodCost,
        total_drink_cost: eventForm.totalDrinkCost
      } as any);
      const evts = await getEvents();
      setEvents(evts);
      if (eventForm.id) {
        setSelectedId(eventForm.id);
      } else {
        const latest = [...evts].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))[0];
        setSelectedId(latest?.id ?? null);
      }
    } catch (e) {
      setError('Could not save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id?: number | null) => {
    if (!id) return;
    const confirmed = window.confirm('Delete this event and its details?');
    if (!confirmed) return;
    setDeleting(true);
    setError('');
    try {
      await deleteEventDetailsByEvent(id);
      await deleteEvent(id);
      const evts = await getEvents();
      setEvents(evts);
      setSelectedId(null);
      setDetails([]);
      resetForm();
    } catch (e) {
      setError('Could not delete event.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} spacing={1}>
            <Typography variant="h5">Event Manager</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={resetForm} disabled={saving || deleting}>
                New Event
              </Button>
              {eventForm.id && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeleteEvent(eventForm.id)}
                  disabled={saving || deleting}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Stack>

          {error && (
            <Typography color="error" variant="body2" mb={1}>
              {error}
            </Typography>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
            <TextField label="Name" value={eventForm.name} onChange={handleField('name')} required fullWidth />
            <TextField label="Location" value={eventForm.location} onChange={handleField('location')} fullWidth />
            <TextField
              select
              label="Asador"
              value={eventForm.asadorId ?? ''}
              onChange={handleField('asadorId')}
              fullWidth
              SelectProps={{ native: false }}
            >
              <MenuItem value="">None</MenuItem>
              {persons
                .filter((p) => p.id != null)
                .map((p) => (
                  <MenuItem key={p.id} value={p.id as number}>
                    {p.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Date"
              type="date"
              value={eventForm.date}
              onChange={handleField('date')}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={2}>
            <TextField
              label="Attendee count"
              type="number"
              value={eventForm.attendeeCount}
              onChange={handleField('attendeeCount')}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Total food cost"
              type="number"
              value={eventForm.totalFoodCost}
              onChange={handleField('totalFoodCost')}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Total drink cost"
              type="number"
              value={eventForm.totalDrinkCost}
              onChange={handleField('totalDrinkCost')}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <Button variant="contained" onClick={handleSave} disabled={saving || deleting} sx={{ alignSelf: { md: 'center' } }}>
              {eventForm.id ? 'Update' : 'Create'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h5">Events History</Typography>
            {loading && <CircularProgress size={18} />}
          </Stack>
          {error && (
            <Typography color="error" variant="body2" mb={1}>
              {error}
            </Typography>
          )}
          {sortedEvents.length === 0 && !loading ? (
            <Typography variant="body2" color="text.secondary">
              No events recorded yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {sortedEvents.map((event) => (
                <CardActionArea key={event.id ?? event.date} onClick={() => setSelectedId(event.id ?? null)}>
                  <Box px={1.5} py={1} sx={{ borderRadius: 1, bgcolor: selectedId === event.id ? 'action.selected' : undefined }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack spacing={0.25}>
                        <Typography fontWeight={600}>{event.date}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(event as any).attendee_count} attendee{(event as any).attendee_count === 1 ? '' : 's'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Typography variant="body2">Food: {(event as any).total_food_cost}</Typography>
                        <Typography variant="body2">Drinks: {(event as any).total_drink_cost}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </CardActionArea>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">Event Details</Typography>
            {loadingDetails && <CircularProgress size={18} />}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {!selectedEvent ? (
            <Typography variant="body2" color="text.secondary">
              Select an event to view details.
            </Typography>
          ) : (
            <EventDetailCard event={selectedEvent} details={details} persons={persons} />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default EventsHistory;
