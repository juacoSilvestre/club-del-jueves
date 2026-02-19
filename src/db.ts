import { openDB, type DBSchema } from 'idb';

export type Person = {
  id?: number;
  name: string;
  alias?: string;
  birthdate?: string;
  email?: string;
  photo?: string;
  passwordHash?: string;
};

export type Event = {
  id?: number;
  name?: string;
  location?: string;
  locationId?: number;
  asadorId?: number;
  date: string;
  attendeeCount: number;
  totalFoodCost: number;
  totalDrinkCost: number;
  photo?: string;
};

export type Location = {
  id?: number;
  name: string;
  address?: string;
  mapsUrl?: string;
};

export type EventDetail = {
  id?: number;
  eventId: number;
  personId: number;
  includeFood?: boolean;
  includeDrink?: boolean;
  foodCost?: number;
  drinkCost?: number;
  note?: string;
};

interface LocalDb extends DBSchema {
  persons: {
    key: number;
    value: Person;
    indexes: { 'by-email': string; 'by-name': string };
  };
  events: {
    key: number;
    value: Event;
    indexes: { 'by-date': string };
  };
  eventDetails: {
    key: number;
    value: EventDetail;
    indexes: { 'by-event': number; 'by-person': number };
  };
  locations: {
    key: number;
    value: Location;
    indexes: { 'by-name': string };
  };
}

const dbPromise = openDB<LocalDb>('cdj-local-db', 4, {
  upgrade(db, _oldVersion, _newVersion, transaction) {
    let personsStore;
    if (!db.objectStoreNames.contains('persons')) {
      personsStore = db.createObjectStore('persons', { keyPath: 'id', autoIncrement: true });
    } else {
      personsStore = transaction.objectStore('persons');
    }

    if (personsStore) {
      if (!personsStore.indexNames.contains('by-email')) {
        personsStore.createIndex('by-email', 'email');
      }
      if (!personsStore.indexNames.contains('by-name')) {
        personsStore.createIndex('by-name', 'name');
      }
    }

    if (!db.objectStoreNames.contains('events')) {
      const events = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      events.createIndex('by-date', 'date');
    }

    if (!db.objectStoreNames.contains('eventDetails')) {
      const details = db.createObjectStore('eventDetails', { keyPath: 'id', autoIncrement: true });
      details.createIndex('by-event', 'eventId');
      details.createIndex('by-person', 'personId');
    }

    if (!db.objectStoreNames.contains('locations')) {
      const locations = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
      locations.createIndex('by-name', 'name');
    }
  }
});

export async function getPersons() {
  return (await dbPromise).getAll('persons');
}

export async function getPerson(id: number) {
  return (await dbPromise).get('persons', id);
}

export async function savePerson(person: Person) {
  const db = await dbPromise;
  const payload = { ...person } as Person;
  if (payload.email) {
    payload.email = payload.email.trim().toLowerCase();
  }
  if (!payload.id) {
    delete (payload as { id?: number }).id;
    return (await db.add('persons', payload)) as number;
  }
  return (await db.put('persons', payload)) as number;
}

export async function deletePerson(id: number) {
  return (await dbPromise).delete('persons', id);
}

export async function findPersonByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const db = await dbPromise;
  const byIndex = await db.getFromIndex('persons', 'by-email', normalized);
  if (byIndex) return byIndex;
  const all = await getPersons();
  return all.find((p) => (p.email || '').trim().toLowerCase() === normalized);
}

export async function findPersonsByName(name: string) {
  const normalized = name.trim().toLowerCase();
  const db = await dbPromise;
  const byIndex = await db.getAllFromIndex('persons', 'by-name', normalized);
  if (byIndex.length) return byIndex;
  const all = await getPersons();
  return all.filter((p) => (p.name || '').trim().toLowerCase() === normalized);
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
  return (await dbPromise).getAll('events');
}

export async function getEvent(id: number) {
  return (await dbPromise).get('events', id);
}

export async function saveEvent(event: Event) {
  const db = await dbPromise;
  const payload = { ...event } as Event;
  if (!payload.id) {
    delete (payload as { id?: number }).id;
    return (await db.add('events', payload)) as number;
  }
  return (await db.put('events', payload)) as number;
}

export async function deleteEvent(id: number) {
  return (await dbPromise).delete('events', id);
}

export async function getEventDetailsByEvent(eventId: number) {
  const db = await dbPromise;
  return db.getAllFromIndex('eventDetails', 'by-event', eventId);
}

export async function deleteEventDetailsByEvent(eventId: number) {
  const db = await dbPromise;
  const tx = db.transaction('eventDetails', 'readwrite');
  const index = tx.store.index('by-event');
  for await (const cursor of index.iterate(eventId)) {
    await cursor.delete();
  }
  await tx.done;
}

export async function getEventDetailsByPerson(personId: number) {
  const db = await dbPromise;
  return db.getAllFromIndex('eventDetails', 'by-person', personId);
}

export async function saveEventDetail(detail: EventDetail) {
  const db = await dbPromise;
  const payload = { ...detail } as EventDetail;
  if (!payload.id) {
    delete (payload as { id?: number }).id;
    return (await db.add('eventDetails', payload)) as number;
  }
  return (await db.put('eventDetails', payload)) as number;
}

export async function deleteEventDetail(id: number) {
  return (await dbPromise).delete('eventDetails', id);
}

export async function clearDatabase() {
  const db = await dbPromise;
  const tx = db.transaction(['persons', 'events', 'eventDetails', 'locations'], 'readwrite');
  await Promise.all([
    tx.objectStore('persons').clear(),
    tx.objectStore('events').clear(),
    tx.objectStore('eventDetails').clear(),
    tx.objectStore('locations').clear()
  ]);
  await tx.done;
}

export async function getLocations() {
  return (await dbPromise).getAll('locations');
}

export async function getLocation(id: number) {
  return (await dbPromise).get('locations', id);
}

export async function saveLocation(location: Location) {
  const db = await dbPromise;
  const payload = { ...location } as Location;
  if (!payload.id) {
    delete (payload as { id?: number }).id;
    return (await db.add('locations', payload)) as number;
  }
  return (await db.put('locations', payload)) as number;
}

export async function deleteLocation(id: number) {
  return (await dbPromise).delete('locations', id);
}
