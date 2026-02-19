import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Avatar, Button, Card, CardContent, Collapse, Stack, TextField, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setUser, signOut } from '../features/auth/authSlice';
import { findPersonByIdentifier, savePerson, getPerson } from '../db';
import { hashPassword, passwordsMatch } from '../auth/password';
import type { Person } from '../db';
import { resizeImageTo100 } from '../utils/resizeImage';

function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerAlias, setRegisterAlias] = useState('');
  const [registerBirthdate, setRegisterBirthdate] = useState('');
  const [registerPhoto, setRegisterPhoto] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const [editPerson, setEditPerson] = useState<Person | null>(null);

  const [busy, setBusy] = useState(false);

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error || new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const normalizeEmail = (email: string) => email.trim().toLowerCase();
  const normalizeIdentifier = (value: string) => value.trim().toLowerCase();

  const resetRegisterForm = () => {
    setRegisterName('');
    setRegisterEmail('');
    setRegisterAlias('');
    setRegisterBirthdate('');
    setRegisterPhoto('');
    setRegisterPassword('');
    setRegisterConfirm('');
    setRegisterError('');
  };

  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Enter your email or name and password.');
      return;
    }
    setBusy(true);
    setLoginError('');
    try {
      const person = await findPersonByIdentifier(normalizeIdentifier(loginIdentifier));
      if (!person || !person.password_hash || person.id == null) {
        setLoginError('User not found or missing password.');
        return;
      }

      const ok = await passwordsMatch(loginPassword, person.password_hash);
      if (!ok) {
        setLoginError('Invalid credentials.');
        return;
      }

      dispatch(setUser({ id: person.id, name: person.name, email: person.email }));
      navigate('/');
    } catch (err) {
      console.error('Login failed', err);
      setLoginError('Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim()) {
      setRegisterError('Name is required.');
      return;
    }
    if (!registerPassword || registerPassword !== registerConfirm) {
      setRegisterError('Passwords must match.');
      return;
    }

    setBusy(true);
    setRegisterError('');
    try {
      const normalizedEmail = registerEmail ? normalizeEmail(registerEmail) : '';
      const normalizedName = registerName.trim();

      if (normalizedEmail) {
        const existingEmail = await findPersonByIdentifier(normalizedEmail);
        if (existingEmail && existingEmail.id !== editPerson?.id) {
          setRegisterError('Email already in use.');
          return;
        }
      }

      const existingName = await findPersonByIdentifier(normalizeIdentifier(normalizedName));
      if (existingName && existingName.id !== editPerson?.id) {
        setRegisterError('Name already in use.');
        return;
      }

      const password_hash = await hashPassword(registerPassword);
      const payload = {
        id: editPerson?.id,
        name: registerName.trim(),
        email: normalizedEmail || undefined,
        alias: registerAlias.trim() || undefined,
        birthdate: registerBirthdate || undefined,
        photo: registerPhoto || undefined,
        password_hash: password_hash
      };

      const newId = await savePerson(payload);

      dispatch(setUser({ id: newId, name: registerName.trim(), email: normalizedEmail || undefined }));
      resetRegisterForm();
      setEditPerson(null);
      setShowRegister(false);
      navigate('/');
    } catch (err) {
      console.error('Registration failed', err);
      setRegisterError('Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setRegisterError('Image must be 2MB or less.');
      event.target.value = '';
      return;
    }
    try {
      // Resize to 100x100 and store as base64 data URL
      const resizedBlob = await resizeImageTo100(file);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(reader.error || new Error('Could not read image'));
        reader.readAsDataURL(resizedBlob);
      });
      setRegisterPhoto(dataUrl);
      setRegisterError('');
    } catch (e) {
      setRegisterError('Could not read image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSignOut = () => {
    dispatch(signOut());
  };

  const loadEditPerson = async () => {
    if (!authUser?.id) return;
    try {
      const person = await getPerson(authUser.id);
      if (person) {
        setEditPerson(person);
        setRegisterName(person.name || '');
        setRegisterEmail(person.email || '');
        setRegisterAlias(person.alias || '');
        setRegisterBirthdate(person.birthdate || '');
        setRegisterPhoto(person.photo || '');
        setShowRegister(true);
      }
    } catch (err) {
      console.error('Could not load person', err);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h5" component="h1">
              Account access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with your name or email and password. To register, create a person entry with a password.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {authUser && (
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 56, height: 56 }}>
                  {authUser.name.charAt(0)}
                </Avatar>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1">{authUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {authUser.email || 'No email saved'}
                  </Typography>
                </Stack>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Button variant="outlined" onClick={loadEditPerson} disabled={true}>
                  Edit profile
                </Button>
                <Button variant="outlined" color="secondary" startIcon={<LogoutIcon />} onClick={handleSignOut} disabled={busy}>
                  Sign out
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!authUser && (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <LoginIcon fontSize="small" /> Sign in
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
              <TextField
                label="Email or name"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleLogin} disabled={busy}>
                Sign in
              </Button>
            </Stack>
            {loginError && <Alert severity="error">{loginError}</Alert>}
          </Stack>
        </CardContent>
      </Card>
      )}

      {(!authUser || showRegister) && (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              {editPerson ? <EditIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />} {editPerson ? 'Edit profile' : 'Register'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={showRegister ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowRegister((prev) => !prev)}
              >
                {showRegister ? 'Hide form' : 'Open form'}
              </Button>
              {!showRegister && registerError && <Alert severity="error">{registerError}</Alert>}
            </Stack>

            <Collapse in={showRegister} timeout="auto" unmountOnExit>
              <Stack spacing={2} mt={1}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
                  <TextField label="Name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required fullWidth />
                  <TextField label="Email (optional)" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} fullWidth />
                  <TextField label="Alias (optional)" value={registerAlias} onChange={(e) => setRegisterAlias(e.target.value)} fullWidth />
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
                  <TextField
                    label="Birthdate"
                    type="date"
                    value={registerBirthdate}
                    onChange={(e) => setRegisterBirthdate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                    <Button variant="outlined" component="label" disabled={busy}>
                      {registerPhoto ? 'Replace photo' : 'Upload photo'}
                      <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {registerPhoto ? 'Image ready (base64)' : 'No image selected'}
                    </Typography>
                    {registerPhoto && (
                      <Button size="small" onClick={() => setRegisterPhoto('')} disabled={busy}>
                        Clear photo
                      </Button>
                    )}
                  </Stack>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
                  <TextField
                    label="Password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Confirm password"
                    type="password"
                    value={registerConfirm}
                    onChange={(e) => setRegisterConfirm(e.target.value)}
                    required
                    fullWidth
                  />
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={editPerson ? <EditIcon /> : <PersonAddIcon />} onClick={handleRegister} disabled={busy}>
                      {editPerson ? 'Update account' : 'Create account'}
                    </Button>
                    <Button variant="text" onClick={() => { resetRegisterForm(); setShowRegister(false); }} disabled={busy}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
                {registerError && <Alert severity="error">{registerError}</Alert>}
              </Stack>
            </Collapse>
          </Stack>
        </CardContent>
      </Card>
      )}
    </Stack>
  );
}

export default Login;