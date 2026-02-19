import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  Button,
  Card,
  CardContent,
  Avatar,
  Checkbox,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import EventDetailCard from '../components/EventDetailCard';
import type { Event, EventDetail, Person, Location } from '../db';
import {
  deleteEventDetailsByEvent,
  getEventDetailsByEvent,
  getEvents,
  getLocations,
  getPersons,
  saveEvent,
  saveEventDetail
} from '../db';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [details, setDetails] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [error, setError] = useState('');
  type EventFormState = {
    name: string;
    location: string;
    locationId: number | null;
    date: string;
    asadorId: number | null;
    photo: string;
  };

  const [eventForm, setEventForm] = useState<EventFormState>({
    name: '',
    location: '',
    locationId: null,
    date: new Date().toISOString().split('T')[0],
    asadorId: null,
    photo: ''
  });

  type AttendeeForm = {
    personId: number;
    selected: boolean;
    includeFood: boolean;
    includeDrink: boolean;
    foodCost: number;
    drinkCost: number;
  };

  const [attendees, setAttendees] = useState<AttendeeForm[]>([]);

  const allSelected = attendees.length > 0 && attendees.every((a) => a.selected);
  const someSelected = attendees.some((a) => a.selected);

  const latestEvent = useMemo(() => {
    return [...events].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))[0];
  }, [events]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [evts, prs, locs] = await Promise.all([getEvents(), getPersons(), getLocations()]);
        if (!active) return;
        setEvents(evts);
        setPersons(prs);
        setLocations(locs);
        setAttendees(
          prs
            .filter((p) => p.id != null)
            .map((p) => ({
              personId: p.id as number,
              selected: false,
              includeFood: true,
              includeDrink: true,
              foodCost: 0,
              drinkCost: 0
            }))
        );
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
    let active = true;
    const eventId = latestEvent?.id;
    if (!eventId) {
      setDetails([]);
      return;
    }
    (async () => {
      setLoadingDetails(true);
      setError('');
      try {
        const det = await getEventDetailsByEvent(eventId);
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
  }, [latestEvent?.id]);

  const handleEventField = (field: 'name' | 'location' | 'date') => (e: ChangeEvent<HTMLInputElement>) => {
    setEventForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLocationSelect = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    const id = value ? Number(value) : null;
    const loc = locations.find((l) => l.id === id) || null;
    setEventForm((prev) => ({ ...prev, locationId: id, location: loc?.name || '' }));
  };

  const handleEventPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 2MB or less.');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setEventForm((prev) => ({ ...prev, photo: dataUrl }));
      setError('');
    } catch (e) {
      setError('Could not read image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleClearEventPhoto = () => {
    setEventForm((prev) => ({ ...prev, photo: '' }));
  };

  const handleAsadorChange = (
    e: SelectChangeEvent | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = (e.target as HTMLInputElement).value;
    setEventForm((prev) => ({ ...prev, asadorId: value ? Number(value) : null }));
  };

  const updateAttendee = (personId: number, updater: (prev: AttendeeForm) => AttendeeForm) => {
    setAttendees((prev) => prev.map((a) => (a.personId === personId ? updater(a) : a)));
  };

  const resetToCreate = () => {
    setFormMode('create');
    setEditingEventId(null);
    setEventForm({ name: '', location: '', locationId: null, date: new Date().toISOString().split('T')[0], asadorId: null, photo: '' });
    setAttendees((prev) => prev.map((a) => ({ ...a, selected: false, foodCost: 0, drinkCost: 0, includeFood: true, includeDrink: true })));
  };

  const loadEventForEdit = () => {
    if (!latestEvent) return;
    setFormMode('edit');
    setEditingEventId(latestEvent.id ?? null);
    const matchedLocation = locations.find((l) => l.id === latestEvent.locationId) || locations.find((l) => l.name === latestEvent.location);
    setEventForm({
      name: latestEvent.name || '',
      location: matchedLocation?.name || latestEvent.location || '',
      locationId: matchedLocation?.id ?? null,
      date: latestEvent.date,
      asadorId: latestEvent.asadorId ?? null,
      photo: latestEvent.photo || ''
    });

    const detailByPerson = new Map<number, EventDetail>();
    details.forEach((d) => {
      if (d.personId != null) detailByPerson.set(d.personId, d);
    });

    setAttendees((prev) =>
      prev.map((a) => {
        const det = detailByPerson.get(a.personId);
        if (!det) return { ...a, selected: false, foodCost: 0, drinkCost: 0, includeFood: true, includeDrink: true };
        return {
          ...a,
          selected: true,
          includeFood: det.includeFood !== false,
          includeDrink: det.includeDrink !== false,
          foodCost: det.includeFood === false ? 0 : det.foodCost ?? 0,
          drinkCost: det.includeDrink === false ? 0 : det.drinkCost ?? 0
        };
      })
    );
    setShowForm(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.name.trim()) {
      setError('Event name is required.');
      return;
    }
    setSavingEvent(true);
    setError('');
    try {
      const selected = attendees.filter((a) => a.selected);
      const attendeeCount = selected.length;
      const totalFoodCost = selected.reduce((sum, a) => sum + (a.includeFood ? a.foodCost : 0), 0);
      const totalDrinkCost = selected.reduce((sum, a) => sum + (a.includeDrink ? a.drinkCost : 0), 0);

      const selectedLocation = eventForm.locationId ? locations.find((l) => l.id === eventForm.locationId) : null;

      const eventId = await saveEvent({
        id: formMode === 'edit' ? editingEventId ?? undefined : undefined,
        name: eventForm.name.trim(),
        location: (selectedLocation?.name || eventForm.location).trim() || undefined,
        locationId: selectedLocation?.id ?? undefined,
        asadorId: eventForm.asadorId ?? undefined,
        photo: eventForm.photo || undefined,
        date: eventForm.date,
        attendeeCount,
        totalFoodCost,
        totalDrinkCost
      });

      if (formMode === 'edit' && editingEventId) {
        await deleteEventDetailsByEvent(editingEventId);
      }

      await Promise.all(
        selected.map((a) =>
          saveEventDetail({
            eventId,
            personId: a.personId,
            includeFood: a.includeFood,
            includeDrink: a.includeDrink,
            foodCost: a.includeFood ? a.foodCost : 0,
            drinkCost: a.includeDrink ? a.drinkCost : 0
          })
        )
      );

      const evts = await getEvents();
      setEvents(evts);
      setShowForm(false);
      resetToCreate();

      if (formMode === 'edit' && editingEventId) {
        const det = await getEventDetailsByEvent(editingEventId);
        setDetails(det);
      }
    } catch (err) {
      console.error('Could not save event', err);
      setError('Could not save event.');
    } finally {
      setSavingEvent(false);
    }
  };

  const toggleAllAttendees = (selected: boolean) => {
    setAttendees((prev) => prev.map((a) => ({ ...a, selected })));
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Club Del Jueves
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Club de amigos, atmosfera parrillera y momentos para el olvido.
          </Typography>
          <Typography variant="body1" color="text.secondary" align="right">
            Desde 2015
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Latest Event</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {(loading || loadingDetails) && <CircularProgress size={18} />}
              <Button
                variant="contained"
                onClick={() => {
                  resetToCreate();
                  setShowForm(true);
                }}
                disabled={savingEvent}
              >
                Create Event
              </Button>
              {latestEvent && (
                <Button variant="outlined" onClick={loadEventForEdit} disabled={savingEvent || !details.length}>
                  Edit Event
                </Button>
              )}
            </Stack>
          </Stack>

          {showForm && (
            <Stack spacing={2} mb={3}>
              <Typography variant="subtitle1" fontWeight={700}>
                {formMode === 'edit' ? 'Edit event' : 'Create event'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Event name" value={eventForm.name} onChange={handleEventField('name')} required fullWidth />
                <TextField
                  select
                  label="Location"
                  value={eventForm.locationId ?? ''}
                  onChange={(e) => handleLocationSelect(e as SelectChangeEvent<string>)}
                  fullWidth
                  SelectProps={{ native: false }}
                >
                  <MenuItem value="">Select location</MenuItem>
                  {locations
                    .filter((l) => l.id != null)
                    .map((loc) => (
                      <MenuItem key={loc.id} value={loc.id as number}>
                        {loc.name}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  label="Location name (auto from selection, editable)"
                  value={eventForm.location}
                  onChange={handleEventField('location')}
                  fullWidth
                />
                <TextField
                  label="Date"
                  type="date"
                  value={eventForm.date}
                  onChange={handleEventField('date')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                />
                <Stack spacing={0.5} sx={{ minWidth: 200 }}>
                  <Button variant="outlined" component="label" disabled={savingEvent}>
                    {eventForm.photo ? 'Replace photo' : 'Upload photo'}
                    <input type="file" accept="image/*" hidden onChange={handleEventPhotoChange} />
                  </Button>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {eventForm.photo ? 'Image saved (base64)' : 'No image selected'}
                    </Typography>
                    {eventForm.photo && (
                      <Button size="small" onClick={handleClearEventPhoto} disabled={savingEvent}>
                        Clear
                      </Button>
                    )}
                  </Stack>
                </Stack>
                <TextField
                  select
                  label="Asador"
                  value={eventForm.asadorId ?? ''}
                  onChange={handleAsadorChange}
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
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 160 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Include
                        </Typography>
                        <Checkbox
                          checked={allSelected}
                          indeterminate={!allSelected && someSelected}
                          onChange={(e) => toggleAllAttendees(e.target.checked)}
                          inputProps={{ 'aria-label': 'Select or deselect all attendees' }}
                          disabled={savingEvent}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Food</TableCell>
                    <TableCell>Drinks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendees.map((attendee) => {
                    const person = persons.find((p) => p.id === attendee.personId);
                    return (
                      <TableRow key={attendee.personId}>
                        <TableCell>
                          <Checkbox
                            checked={attendee.selected}
                            onChange={(e) => updateAttendee(attendee.personId, (prev) => ({ ...prev, selected: e.target.checked }))}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                              src={person?.photo || undefined}
                              sx={{ width: 32, height: 32 }}
                              alt={person?.name || 'Person'}
                            >
                              {(person?.name || 'U').charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{person?.name || 'Unknown'}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Checkbox
                              checked={attendee.includeFood}
                              onChange={(e) => updateAttendee(attendee.personId, (prev) => ({ ...prev, includeFood: e.target.checked }))}
                              disabled={!attendee.selected}
                            />
                            <TextField
                              type="number"
                              size="small"
                              label="Food"
                              inputProps={{ min: 0 }}
                              value={attendee.foodCost}
                              onChange={(e) =>
                                updateAttendee(attendee.personId, (prev) => ({
                                  ...prev,
                                  foodCost: Number(e.target.value) || 0
                                }))
                              }
                              disabled={!attendee.selected}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Checkbox
                              checked={attendee.includeDrink}
                              onChange={(e) => updateAttendee(attendee.personId, (prev) => ({ ...prev, includeDrink: e.target.checked }))}
                              disabled={!attendee.selected}
                            />
                            <TextField
                              type="number"
                              size="small"
                              label="Drinks"
                              inputProps={{ min: 0 }}
                              value={attendee.drinkCost}
                              onChange={(e) =>
                                updateAttendee(attendee.personId, (prev) => ({
                                  ...prev,
                                  drinkCost: Number(e.target.value) || 0
                                }))
                              }
                              disabled={!attendee.selected}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleSaveEvent} disabled={savingEvent}>
                  {formMode === 'edit' ? 'Update Event' : 'Save Event'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowForm(false);
                    resetToCreate();
                  }}
                  disabled={savingEvent}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          )}

          {error && (
            <Typography color="error" variant="body2" mb={1}>
              {error}
            </Typography>
          )}
          {!latestEvent ? (
            <Typography variant="body2" color="text.secondary">
              No events recorded yet.
            </Typography>
          ) : (
            <EventDetailCard event={latestEvent} details={details} persons={persons} />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default Home;
