import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Link as MuiLink
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { type Person, type Location, deletePerson, getPersons, savePerson, getLocations, saveLocation, deleteLocation } from '../db';
import { useAppSelector } from '../hooks';
import { resizeImageTo100 } from '../utils/resizeImage';

type PersonFormState = Required<Pick<Person, 'name'>> & Omit<Person, 'name'>;

const emptyPerson: PersonFormState = {
  id: undefined,
  name: '',
  alias: '',
  birthdate: '',
  email: '',
  photo: ''
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

function Administration() {
  const authUser = useAppSelector((state) => state.auth.user);
  const canDeletePersons = (authUser?.email || '').toLowerCase() === 'juaco.silvestre@gmail.com';

  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PersonFormState>(emptyPerson);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationForm, setLocationForm] = useState<Location>({ id: undefined, name: '', address: '', maps_url: '' });
  const [locationError, setLocationError] = useState('');

  const sortedPersons = useMemo(() => {
    return [...persons].sort((a, b) => a.name.localeCompare(b.name));
  }, [persons]);

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setLocationsLoading(true);
      setError('');
      setLocationError('');
      try {
        const [personsData, locationsData] = await Promise.all([getPersons(), getLocations()]);
        if (active) {
          setPersons(personsData);
          setLocations(locationsData);
        }
      } catch (e) {
        if (active) {
          setError('Could not load persons.');
          setLocationError('Could not load locations.');
        }
      } finally {
        if (active) {
          setLoading(false);
          setLocationsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field: keyof PersonFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 2MB or less.');
      return;
    }
    try {
      // Resize to 100x100 and store as base64 data URL
      const resizedBlob = await resizeImageTo100(file);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(reader.error || new Error('Could not read file'));
        reader.readAsDataURL(resizedBlob);
      });
      setForm((prev) => ({ ...prev, photo: dataUrl }));
      setError('');
    } catch (e) {
      setError('Could not read image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleClearPhoto = () => {
    setForm((prev) => ({ ...prev, photo: '' }));
  };

  const resetForm = () => {
    setForm(emptyPerson);
    setError('');
  };

  const handleEdit = (person: Person) => {
    setForm({
      id: person.id,
      name: person.name,
      alias: person.alias || '',
      birthdate: person.birthdate || '',
      email: person.email || '',
      photo: person.photo || ''
    });
  };

  const handleDelete = async (id?: number) => {
    if (!canDeletePersons) return;
    if (!id) return;
    const confirmed = window.confirm('Delete this person?');
    if (!confirmed) return;
    setSaving(true);
    setError('');
    try {
      await deletePerson(id);
      const data = await getPersons();
      setPersons(data);
      if (form.id === id) resetForm();
    } catch (e) {
      setError('Could not delete person.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAlias = async (alias?: string) => {
    if (!alias) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(alias);
      } else {
        throw new Error('Clipboard not available');
      }
    } catch (e) {
      console.error('Could not copy alias', e);
      setError('Could not copy alias.');
    }
  };

  const toMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'Unexpected error';
  };

  const handleLocationChange = (field: 'name' | 'address' | 'maps_url') => (event: ChangeEvent<HTMLInputElement>) => {
    setLocationForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetLocationForm = () => {
    setLocationForm({ id: undefined, name: '', address: '', maps_url: '' });
    setLocationError('');
  };

  const handleLocationEdit = (loc: Location) => {
    setLocationForm({ id: loc.id, name: loc.name, address: loc.address || '', maps_url: loc.maps_url || '' });
  };

  const handleLocationDelete = async (id?: number) => {
    if (!id) return;
    const confirmed = window.confirm('Delete this location?');
    if (!confirmed) return;
    setLocationSaving(true);
    setLocationError('');
    try {
      await deleteLocation(id);
      const data = await getLocations();
      setLocations(data);
      if (locationForm.id === id) resetLocationForm();
    } catch (e) {
      setLocationError('Could not delete location.');
    } finally {
      setLocationSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await savePerson({
        id: form.id,
        name: form.name.trim(),
        alias: form.alias?.trim() || undefined,
        birthdate: form.birthdate || undefined,
        email: form.email?.trim() || undefined,
        photo: form.photo || undefined
      });
      const data = await getPersons();
      setPersons(data);
      resetForm();
    } catch (e) {
      console.error('Could not save person', e);
      setError(`Could not save person: ${toMessage(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!locationForm.name.trim()) {
      setLocationError('Name is required.');
      return;
    }
    setLocationSaving(true);
    setLocationError('');
    try {
      await saveLocation({
        id: locationForm.id,
        name: locationForm.name.trim(),
        address: locationForm.address?.trim() || undefined,
        maps_url: locationForm.maps_url?.trim() || undefined
      });
      const data = await getLocations();
      setLocations(data);
      resetLocationForm();
    } catch (e) {
      setLocationError(`Could not save location: ${toMessage(e)}`);
    } finally {
      setLocationSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Persons
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add, edit, or remove people stored locally in IndexedDB.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
              <TextField
                label="Name"
                value={form.name}
                onChange={handleChange('name')}
                required
                fullWidth
              />
              <TextField label="Alias" value={form.alias} onChange={handleChange('alias')} fullWidth />
              <TextField
                label="Birthdate"
                type="date"
                value={form.birthdate}
                onChange={handleChange('birthdate')}
                InputLabelProps={{ shrink: true }}
              />
              <Stack spacing={0.5} sx={{ minWidth: 200 }}>
                <Button variant="outlined" component="label" disabled={saving}>
                  {form.photo ? 'Replace photo' : 'Upload photo'}
                  <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                </Button>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {form.photo ? 'Image saved (base64)' : 'No image selected'}
                  </Typography>
                  {form.photo && (
                    <Button size="small" onClick={handleClearPhoto} disabled={saving}>
                      Clear
                    </Button>
                  )}
                </Stack>
                {form.photo && (
                  <Box
                    component="img"
                    src={form.photo}
                    alt={form.name ? `${form.name} preview` : 'Person preview'}
                    sx={{ width: 112, height: 112, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                  />
                )}
              </Stack>
              <TextField label="Email" type="email" value={form.email} onChange={handleChange('email')} fullWidth />
              <Stack direction="row" spacing={1}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {form.id ? 'Update' : 'Create'}
                </Button>
                <Button variant="outlined" onClick={resetForm} disabled={saving}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Box>

          {error && (
            <Typography color="error" mt={2} variant="body2">
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Typography variant="h6">Person List</Typography>
            {loading && <CircularProgress size={18} />}
          </Stack>
          {sortedPersons.length === 0 && !loading ? (
            <Typography variant="body2" color="text.secondary">
              No persons yet. Add one using the form above.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Alias</TableCell>
                  <TableCell>Photo</TableCell>
                  <TableCell>Birthdate</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPersons.map((person) => (
                  <TableRow key={person.id ?? person.name} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={person.photo || undefined} sx={{ width: 32, height: 32 }} alt={person.name}>
                          {person.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{person.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{person.alias || '—'}</span>
                        <Tooltip title={person.alias ? 'Copy alias' : 'No alias to copy'}>
                          <span>
                            <IconButton
                              aria-label="Copy alias"
                              onClick={() => handleCopyAlias(person.alias)}
                              size="small"
                              disabled={!person.alias || saving}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {person.photo ? (
                        <Avatar src={person.photo} sx={{ width: 28, height: 28 }} alt={person.name} />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{person.birthdate || '—'}</TableCell>
                    <TableCell>{person.email || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="Edit" onClick={() => handleEdit(person)} size="small" disabled={saving}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label="Delete"
                        onClick={() => handleDelete(person.id)}
                        size="small"
                        disabled={saving || !canDeletePersons}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Locations
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Manage reusable locations with name, address, and Google Maps links.
          </Typography>

          <Box component="form" onSubmit={handleLocationSubmit} noValidate>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
              <TextField label="Name" value={locationForm.name} onChange={handleLocationChange('name')} required fullWidth />
              <TextField label="Address" value={locationForm.address} onChange={handleLocationChange('address')} fullWidth />
              <TextField label="Google Maps link" value={locationForm.maps_url} onChange={handleLocationChange('maps_url')} fullWidth />
              <Stack direction="row" spacing={1}>
                <Button type="submit" variant="contained" disabled={locationSaving}>
                  {locationForm.id ? 'Update' : 'Create'}
                </Button>
                <Button variant="outlined" onClick={resetLocationForm} disabled={locationSaving}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Box>

          {locationError && (
            <Typography color="error" mt={2} variant="body2">
              {locationError}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Typography variant="h6">Saved Locations</Typography>
            {locationsLoading && <CircularProgress size={18} />}
          </Stack>
          {sortedLocations.length === 0 && !locationsLoading ? (
            <Typography variant="body2" color="text.secondary">
              No locations yet. Add one using the form above.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Maps</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedLocations.map((loc) => (
                  <TableRow key={loc.id ?? loc.name} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32 }}>{loc.name.charAt(0)}</Avatar>
                        <Typography variant="body2">{loc.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{loc.address || '—'}</TableCell>
                    <TableCell>
                      {loc.maps_url ? (
                        <MuiLink href={loc.maps_url} target="_blank" rel="noopener noreferrer">
                          Maps
                        </MuiLink>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton aria-label="Edit" onClick={() => handleLocationEdit(loc)} size="small" disabled={locationSaving}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton aria-label="Delete" onClick={() => handleLocationDelete(loc.id)} size="small" disabled={locationSaving}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default Administration;
