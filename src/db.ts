import { supabase } from './supabase';

export type Person = {
  id?: number;
  name: string;
  alias?: string;
  birthdate?: string;
  email?: string;
  photo?: string;
  password_hash?: string;
};

export type Event = {
  id?: number;
  name?: string;
  location?: string;
  location_id?: number;
  asador_id?: number;
  date: string;
  attendee_count: number;
  total_food_cost: number;
  total_drink_cost: number;
  photo?: string;
};

export type Location = {
  id?: number;
  name: string;
  address?: string;
  maps_url?: string;
};

export type EventDetail = {
  id?: number;
  event_id: number;
  person_id: number;
  include_food?: boolean;
  include_drink?: boolean;
  food_cost?: number;
  drink_cost?: number;
  note?: string;
};

const requireClient = () => {
  if (!supabase) {
    throw new Error('Supabase client not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

export async function getPersons() {
  const client = requireClient();
  const { data, error } = await client.from('persons').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as Person[];
}

export async function getPerson(id: number) {
  const client = requireClient();
  const { data, error } = await client.from('persons').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Person;
}

export async function savePerson(person: Person) {
  const client = requireClient();
  const payload = { ...person } as Person;
  if (payload.email) payload.email = payload.email.trim().toLowerCase();
  const { data, error } = await client
    .from('persons')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: number }).id;
}

export async function deletePerson(id: number) {
  const client = requireClient();
  const { error } = await client.from('persons').delete().eq('id', id);
  if (error) throw error;
}

export async function findPersonByEmail(email: string) {
  const client = requireClient();
  const normalized = email.trim().toLowerCase();
  const { data, error } = await client.from('persons').select('*').eq('email', normalized).maybeSingle();
  if (error) throw error;
  return data as Person | null;
}

export async function findPersonsByName(name: string) {
  const client = requireClient();
  const normalized = name.trim().toLowerCase();
  const { data, error } = await client.from('persons').select('*').ilike('name', normalized);
  if (error) throw error;
  const exact = (data as Person[]).filter((p) => (p.name || '').trim().toLowerCase() === normalized);
  return exact;
}

export async function findPersonByIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  const byEmail = await findPersonByEmail(normalized);
  if (byEmail) return byEmail;
  const matches = await findPersonsByName(normalized);
  if (matches.length > 0) return matches[0];
  const all = await getPersons();
  return all.find((p) => p.name?.trim().toLowerCase() === normalized);
}

export async function getEvents() {
  const client = requireClient();
  const { data, error } = await client.from('events').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data as Event[];
}

export async function getEvent(id: number) {
  const client = requireClient();
  const { data, error } = await client.from('events').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Event;
}

export async function saveEvent(event: Event) {
  const client = requireClient();
  const payload = { ...event } as Event;
  const { data, error } = await client
    .from('events')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: number }).id;
}

export async function deleteEvent(id: number) {
  const client = requireClient();
  const { error } = await client.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function getEventDetailsByEvent(eventId: number) {
  const client = requireClient();
  const { data, error } = await client.from('eventdetails').select('*').eq('event_id', eventId);
  if (error) throw error;
  return data as EventDetail[];
}

export async function deleteEventDetailsByEvent(eventId: number) {
  const client = requireClient();
  const { error } = await client.from('eventdetails').delete().eq('event_id', eventId);
  if (error) throw error;
}

export async function getEventDetailsByPerson(personId: number) {
  const client = requireClient();
  const { data, error } = await client.from('eventdetails').select('*').eq('person_id', personId);
  if (error) throw error;
  return data as EventDetail[];
}

export async function saveEventDetail(detail: EventDetail) {
  const client = requireClient();
  const payload = { ...detail } as EventDetail;
  const { data, error } = await client
    .from('eventdetails')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: number }).id;
}

export async function deleteEventDetail(id: number) {
  const client = requireClient();
  const { error } = await client.from('eventdetails').delete().eq('id', id);
  if (error) throw error;
}

export async function clearDatabase() {
  const client = requireClient();
  await client.from('eventdetails').delete().neq('id', 0);
  await client.from('events').delete().neq('id', 0);
  await client.from('persons').delete().neq('id', 0);
  await client.from('locations').delete().neq('id', 0);
}

export async function getLocations() {
  const client = requireClient();
  const { data, error } = await client.from('locations').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data as Location[];
}

export async function getLocation(id: number) {
  const client = requireClient();
  const { data, error } = await client.from('locations').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Location;
}

export async function saveLocation(location: Location) {
  const client = requireClient();
  const payload = { ...location } as Location;
  const { data, error } = await client
    .from('locations')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: number }).id;
}

export async function deleteLocation(id: number) {
  const client = requireClient();
  const { error } = await client.from('locations').delete().eq('id', id);
  if (error) throw error;
}
