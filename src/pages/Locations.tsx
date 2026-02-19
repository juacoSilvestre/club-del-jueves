import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
  Link
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Location } from '../db';
import { deleteLocation, getLocations, saveLocation } from '../db';

const emptyLocation: Required<Pick<Location, 'name'>> & Omit<Location, 'name'> = {
  id: undefined,
  name: '',
  address: '',
  mapsUrl: ''
};

function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState(emptyLocation);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getLocations();
        if (active) setLocations(data);
      } catch (e) {
        if (active) setError('Could not load locations.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setForm(emptyLocation);
    setError('');
  };

  const handleEdit = (loc: Location) => {
    setForm({
      id: loc.id,
      name: loc.name,
      address: loc.address || '',
      mapsUrl: loc.mapsUrl || ''
    });
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const confirmed = window.confirm('Delete this location?');
    if (!confirmed) return;
    setSaving(true);
    setError('');
    try {
      await deleteLocation(id);
      const data = await getLocations();
      setLocations(data);
      if (form.id === id) resetForm();
    } catch (e) {
      setError('Could not delete location.');
    } finally {
      setSaving(false);
    }
  };

  const toMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'Unexpected error';
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
      await saveLocation({
        id: form.id,
        name: form.name.trim(),
        address: form.address?.trim() || undefined,
        mapsUrl: form.mapsUrl?.trim() || undefined
      });
      const data = await getLocations();
      setLocations(data);
      resetForm();
    } catch (e) {
      setError(`Could not save location: ${toMessage(e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Locations
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Manage reusable locations with name, address, and Google Maps links.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
              <TextField label="Name" value={form.name} onChange={handleChange('name')} required fullWidth />
              <TextField label="Address" value={form.address} onChange={handleChange('address')} fullWidth />
              <TextField label="Google Maps link" value={form.mapsUrl} onChange={handleChange('mapsUrl')} fullWidth />
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
            <Typography variant="h6">Saved Locations</Typography>
            {loading && <CircularProgress size={18} />}
          </Stack>
          {sortedLocations.length === 0 && !loading ? (
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
                      {loc.mapsUrl ? (
                        <Link href={loc.mapsUrl} target="_blank" rel="noopener noreferrer">
                          Maps
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton aria-label="Edit" onClick={() => handleEdit(loc)} size="small" disabled={saving}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton aria-label="Delete" onClick={() => handleDelete(loc.id)} size="small" disabled={saving}>
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

export default Locations;
