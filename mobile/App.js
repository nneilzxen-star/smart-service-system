import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Ctx = createContext(null);
const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const BRAND = '#0876ce';
const GREEN = '#16865b';
const MUTED = '#68778a';
const STATUSES = ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'On the Way', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

const money = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const dateText = (value) => {
  if (!value) return 'Date not set';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleDateString();
};
const errorText = (error) => error?.message || 'Something went wrong. Please try again.';

function useApp() {
  return useContext(Ctx);
}

function Button({ title, onPress, secondary = false, danger = false, disabled = false, busy = false, compact = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        (disabled || busy) && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={secondary ? BRAND : '#fff'} /> : <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{title}</Text>}
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, autoCapitalize, editable = true }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9aa6b5"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize || 'sentences'}
        editable={editable}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Page({ children, refreshing, onRefresh }) {
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={BRAND} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

function Heading({ title, subtitle }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headingSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Status({ value }) {
  const color = value === 'Completed' ? GREEN : ['Cancelled', 'Rejected'].includes(value) ? '#b93838' : BRAND;
  return <Text style={[styles.status, { color, backgroundColor: `${color}16` }]}>{value || 'Unknown'}</Text>;
}

function Empty({ title, text }) {
  return <Card style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.muted}>{text}</Text></Card>;
}

function AuthScreen() {
  const { signIn, signUp, baseUrl, setBaseUrl } = useApp();
  const [register, setRegister] = useState(false);
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (register) await signUp({ name, phone, email, password, role, specialization });
      else await signIn(email, password);
    } catch (error) {
      Alert.alert('Unable to sign in', errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.authRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
        <Text style={styles.brandTitle}>SmartService</Text>
        <Text style={styles.authSubtitle}>Book trusted services and manage your work on the go.</Text>
        <Card style={styles.authCard}>
          <Text style={styles.sectionTitle}>{register ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.label}>Account type</Text>
          <View style={styles.segment}>
            {['customer', 'technician'].map((item) => (
              <Pressable key={item} onPress={() => setRole(item)} style={[styles.segmentItem, role === item && styles.segmentActive]}>
                <Text style={[styles.segmentText, role === item && styles.segmentTextActive]}>{item === 'customer' ? 'Customer' : 'Technician'}</Text>
              </Pressable>
            ))}
          </View>
          {register && <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />}
          {register && <Field label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />}
          {register && role === 'technician' && <Field label="Specialization" value={specialization} onChangeText={setSpecialization} placeholder="e.g. Plumbing and maintenance" />}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
          <Field
            label="API server address"
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="http://192.168.1.20:5000/api"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.helper}>For a physical phone, enter your computer's local IP address, e.g. http://192.168.1.20:5000/api.</Text>
          <Button title={register ? 'Create account' : 'Sign in'} onPress={submit} busy={busy} />
          <Pressable onPress={() => setRegister(!register)} style={styles.linkButton}>
            <Text style={styles.linkText}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function HomeScreen({ navigation }) {
  const { user, request, updateUser } = useApp();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const isTech = user.role === 'technician';

  const load = useCallback(async () => {
    setError('');
    try {
      const jobsResponse = await request('/bookings?limit=50');
      setBookings(jobsResponse.data || []);
      if (isTech) {
        const response = await request('/technicians/stats');
        setStats(response.stats);
      } else {
        const response = await request('/services');
        setServices(response.services || []);
      }
    } catch (err) {
      setError(errorText(err));
    }
  }, [request, isTech]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const active = bookings.find((booking) => ['Assigned', 'Accepted', 'On the Way', 'In Progress'].includes(booking.status));

  const toggleAvailability = async () => {
    const next = user.availability_status === 'available' ? 'offline' : 'available';
    try {
      await request('/technicians/availability', { method: 'PUT', body: { availability_status: next } });
      updateUser({ availability_status: next });
      await refresh();
    } catch (err) {
      Alert.alert('Could not update availability', errorText(err));
    }
  };

  return (
    <Page refreshing={refreshing} onRefresh={refresh}>
      <Heading title={`Hello, ${user.name?.split(' ')[0] || 'there'}`} subtitle={isTech ? 'Your workday at a glance.' : 'What can we help you take care of today?'} />
      {error ? <Card><Text style={styles.errorText}>{error}</Text><Button title="Try again" secondary onPress={refresh} /></Card> : null}
      {isTech ? (
        <>
          <Card>
            <Text style={styles.cardTitle}>Availability</Text>
            <Text style={styles.muted}>Currently {user.availability_status || 'available'}</Text>
            <Button title={user.availability_status === 'available' ? 'Go offline' : 'Go online'} secondary onPress={toggleAvailability} disabled={Boolean(active)} />
            {active ? <Text style={styles.helper}>Availability cannot change while you have an active job.</Text> : null}
          </Card>
          {stats ? (
            <View style={styles.statGrid}>
              <Stat label="Total jobs" value={stats.total_jobs} />
              <Stat label="Completed" value={stats.completed_jobs} />
              <Stat label="Earnings" value={money(stats.total_earnings)} />
              <Stat label="Rating" value={`${Number(stats.rating || 0).toFixed(1)} / 5`} />
            </View>
          ) : null}
          {active ? <BookingCard booking={active} onPress={() => navigation.navigate('JobDetails', { id: active.id })} /> : null}
          <Button title="View my jobs" onPress={() => navigation.navigate('JobsTab')} />
        </>
      ) : (
        <>
          <Button title="Book a service" onPress={() => navigation.navigate('CreateBooking')} />
          {active ? <BookingCard booking={active} onPress={() => navigation.navigate('BookingDetails', { id: active.id })} /> : null}
          <Heading title="Popular services" />
          {services.slice(0, 4).map((service) => (
            <ServiceCard key={service.id} service={service} onPress={() => navigation.navigate('CreateBooking', { serviceId: service.id })} />
          ))}
          <Button title="Browse all services" secondary onPress={() => navigation.navigate('ServicesTab')} />
        </>
      )}
      <Heading title={isTech ? 'Recent jobs' : 'Recent bookings'} />
      {bookings.slice(0, 4).map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onPress={() => navigation.navigate(isTech ? 'JobDetails' : 'BookingDetails', { id: booking.id })}
        />
      ))}
      {!bookings.length ? <Empty title={isTech ? 'No jobs yet' : 'No bookings yet'} text={isTech ? 'New assignments will appear here.' : 'Book your first service to get started.'} /> : null}
    </Page>
  );
}

function Stat({ label, value }) {
  return <Card style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.muted}>{label}</Text></Card>;
}

function ServiceCard({ service, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.cardTitle}>{service.name}</Text>
      <Text style={styles.muted}>{service.category || 'Service'} · {money(service.base_price)}</Text>
      <Text style={styles.bodyText}>{service.description || 'Book a professional service.'}</Text>
      <Text style={styles.linkText}>Book this service ›</Text>
    </Pressable>
  );
}

function BookingCard({ booking, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle} numberOfLines={1}>{booking.service_name || 'Service booking'}</Text>
        <Status value={booking.status} />
      </View>
      <Text style={styles.muted}>{dateText(booking.booking_date)} · {String(booking.booking_time || '').slice(0, 5)}</Text>
      <Text style={styles.muted}>{booking.booking_reference || ''}</Text>
      <Text style={styles.price}>{money(booking.estimated_cost)}</Text>
      {booking.customer_name ? <Text style={styles.muted}>Customer: {booking.customer_name}</Text> : null}
    </Pressable>
  );
}

function ServicesScreen({ navigation }) {
  const { request } = useApp();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await request('/services');
      setServices(response.services || []);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [request]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return (
    <Page refreshing={loading} onRefresh={load}>
      <Heading title="Services" subtitle="Choose a service to start your booking." />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {services.map((service) => <ServiceCard key={service.id} service={service} onPress={() => navigation.navigate('CreateBooking', { serviceId: service.id })} />)}
      {!loading && !services.length ? <Empty title="No services available" text="Please check back later." /> : null}
    </Page>
  );
}

function BookingsScreen({ navigation }) {
  const { user, request } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const isTech = user.role === 'technician';
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await request(`/bookings?limit=100${filter ? `&status=${encodeURIComponent(filter)}` : ''}`);
      setBookings(response.data || []);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [request, filter]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return (
    <Page refreshing={loading} onRefresh={load}>
      <Heading title={isTech ? 'My jobs' : 'My bookings'} subtitle={isTech ? 'Assignments from your dispatcher.' : 'Track and manage your service requests.'} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {['', ...STATUSES].map((status) => (
          <Pressable key={status || 'all'} onPress={() => setFilter(status)} style={[styles.filter, filter === status && styles.filterActive]}>
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>{status || 'All'}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onPress={() => navigation.navigate(isTech ? 'JobDetails' : 'BookingDetails', { id: booking.id })}
        />
      ))}
      {!loading && !bookings.length ? <Empty title="Nothing here yet" text={filter ? `No ${filter.toLowerCase()} items.` : 'Your activity will appear here.'} /> : null}
    </Page>
  );
}

function CreateBookingScreen({ route, navigation }) {
  const { request } = useApp();
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(String(route.params?.serviceId || ''));
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    request('/services').then((result) => setServices(result.services || [])).catch((err) => setError(errorText(err)));
  }, [request]);
  const submit = async () => {
    if (!serviceId || !date || !time || !address.trim()) {
      setError('Choose a service and enter the date, time, and full service address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await request('/bookings', {
        method: 'POST',
        body: { service_id: Number(serviceId), booking_date: date, booking_time: time, service_address: address.trim(), description: description.trim() },
      });
      Alert.alert('Booking created', `Reference: ${result.booking_reference}`);
      navigation.replace('BookingDetails', { id: result.booking_id });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Heading title="Book a service" subtitle="Choose a service and tell us when and where you need help." />
      <Text style={styles.label}>Service</Text>
      {services.map((service) => (
        <Pressable key={service.id} onPress={() => setServiceId(String(service.id))} style={[styles.choice, String(service.id) === serviceId && styles.choiceSelected]}>
          <Text style={styles.cardTitle}>{service.name}</Text>
          <Text style={styles.muted}>{money(service.base_price)} · {service.estimated_duration} min</Text>
        </Pressable>
      ))}
      <Field label="Describe what you need" value={description} onChangeText={setDescription} placeholder="Describe the issue or requested work" multiline />
      <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-12-31" keyboardType="numbers-and-punctuation" />
      <Field label="Time (24-hour HH:MM)" value={time} onChangeText={setTime} placeholder="10:00" keyboardType="numbers-and-punctuation" />
      <Field label="Service address" value={address} onChangeText={setAddress} placeholder="Street, barangay, city" multiline />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button title="Submit booking" onPress={submit} busy={busy} />
    </Page>
  );
}

function BookingDetailsScreen({ route, navigation }) {
  const { request } = useApp();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setError('');
    try {
      const result = await request(`/bookings/${route.params.id}`);
      setBooking(result.booking);
      setEditDate(String(result.booking.booking_date || '').slice(0, 10));
      setEditTime(String(result.booking.booking_time || '').slice(0, 5));
      setEditAddress(result.booking.service_address || '');
      setEditDescription(result.booking.description || '');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [request, route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancel = () => Alert.alert('Cancel booking?', 'This action cannot be undone.', [
    { text: 'Keep booking', style: 'cancel' },
    { text: 'Cancel booking', style: 'destructive', onPress: async () => {
      try {
        await request(`/bookings/${route.params.id}`, { method: 'DELETE' });
        await load();
      } catch (err) {
        Alert.alert('Could not cancel booking', errorText(err));
      }
    } },
  ]);
  const submitReview = async () => {
    setSaving(true);
    try {
      await request(`/bookings/${route.params.id}/review`, { method: 'POST', body: { rating: Number(rating), comment } });
      await load();
      Alert.alert('Thank you', 'Your review has been submitted.');
    } catch (err) {
      Alert.alert('Could not submit review', errorText(err));
    } finally {
      setSaving(false);
    }
  };
  const saveChanges = async () => {
    setSaving(true);
    try {
      await request(`/bookings/${route.params.id}`, {
        method: 'PUT',
        body: { booking_date: editDate, booking_time: editTime, service_address: editAddress, description: editDescription },
      });
      await load();
      Alert.alert('Booking updated', 'Your booking details have been saved.');
    } catch (err) {
      Alert.alert('Could not update booking', errorText(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Page><ActivityIndicator color={BRAND} /></Page>;
  if (!booking) return <Page><Text style={styles.errorText}>{error || 'Booking not found.'}</Text></Page>;
  const canCancel = !['Completed', 'Cancelled', 'In Progress', 'On the Way'].includes(booking.status);
  return (
    <Page>
      <Heading title={booking.service_name || 'Booking details'} subtitle={booking.booking_reference} />
      <Card>
        <View style={styles.rowBetween}><Text style={styles.cardTitle}>Status</Text><Status value={booking.status} /></View>
        <Detail label="Scheduled" value={`${dateText(booking.booking_date)} · ${String(booking.booking_time || '').slice(0, 5)}`} />
        <Detail label="Address" value={booking.service_address} />
        <Detail label="Description" value={booking.description || 'No description'} />
        <Detail label="Technician" value={booking.technician_name || 'Not assigned yet'} />
        <Detail label="Estimated cost" value={money(booking.estimated_cost)} />
        {booking.invoice ? <Detail label={`Invoice · ${booking.invoice.payment_status}`} value={money(booking.invoice.total)} /> : null}
      </Card>
      {['Pending', 'Confirmed'].includes(booking.status) ? (
        <Card>
          <Text style={styles.cardTitle}>Edit booking</Text>
          <Field label="Date (YYYY-MM-DD)" value={editDate} onChangeText={setEditDate} keyboardType="numbers-and-punctuation" />
          <Field label="Time (24-hour HH:MM)" value={editTime} onChangeText={setEditTime} keyboardType="numbers-and-punctuation" />
          <Field label="Service address" value={editAddress} onChangeText={setEditAddress} multiline />
          <Field label="Description" value={editDescription} onChangeText={setEditDescription} multiline />
          <Button title="Save changes" onPress={saveChanges} busy={saving} />
        </Card>
      ) : null}
      {booking.history?.length ? <Card><Text style={styles.cardTitle}>Status history</Text>{booking.history.map((entry) => <Text key={entry.id} style={styles.bodyText}>{entry.new_status} · {new Date(entry.changed_at).toLocaleString()}</Text>)}</Card> : null}
      {canCancel ? <Button title="Cancel booking" danger onPress={cancel} /> : null}
      {booking.status === 'Completed' && !booking.review ? (
        <Card>
          <Text style={styles.cardTitle}>Leave a review</Text>
          <Field label="Rating (1-5)" value={rating} onChangeText={setRating} keyboardType="number-pad" />
          <Field label="Comment (optional)" value={comment} onChangeText={setComment} multiline />
          <Button title="Submit review" onPress={submitReview} busy={saving} />
        </Card>
      ) : null}
      {booking.review ? <Card><Text style={styles.cardTitle}>Your review</Text><Text style={styles.bodyText}>{booking.review.rating} / 5 · {booking.review.comment}</Text></Card> : null}
      <Button title="Refresh status" secondary onPress={load} />
    </Page>
  );
}

function Detail({ label, value }) {
  return <View style={styles.detail}><Text style={styles.muted}>{label}</Text><Text style={styles.bodyText}>{value || '—'}</Text></View>;
}

function JobDetailsScreen({ route, navigation }) {
  const { request } = useApp();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const result = await request(`/bookings/${route.params.id}`);
      setBooking(result.booking);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [request, route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const update = async (path, body) => {
    setBusy(true);
    try {
      await request(`/bookings/${route.params.id}/${path}`, { method: 'POST', body });
      setNotes('');
      if (path === 'reject') {
        Alert.alert('Job rejected', 'The job has been returned to the dispatcher for reassignment.');
        navigation.goBack();
        return;
      }
      await load();
    } catch (err) {
      Alert.alert('Could not update job', errorText(err));
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <Page><ActivityIndicator color={GREEN} /></Page>;
  if (!booking) return <Page><Text style={styles.errorText}>{error || 'Job not found.'}</Text></Page>;
  return (
    <Page>
      <Heading title={booking.service_name || 'Job details'} subtitle={booking.booking_reference} />
      <Card>
        <View style={styles.rowBetween}><Text style={styles.cardTitle}>Job status</Text><Status value={booking.status} /></View>
        <Detail label="Customer" value={booking.customer_name} />
        <Detail label="Phone" value={booking.customer_phone} />
        <Detail label="Scheduled" value={`${dateText(booking.booking_date)} · ${String(booking.booking_time || '').slice(0, 5)}`} />
        <Detail label="Service address" value={booking.service_address} />
        <Detail label="Customer notes" value={booking.description} />
        <Detail label="Estimated cost" value={money(booking.estimated_cost)} />
      </Card>
      {booking.status === 'Assigned' ? (
        <View style={styles.buttonRow}>
          <Button title="Accept job" onPress={() => update('accept')} busy={busy} />
          <Button title="Reject" danger onPress={() => update('reject')} disabled={busy} />
        </View>
      ) : null}
      {['Accepted', 'On the Way', 'In Progress'].includes(booking.status) ? (
        <Card>
          <Text style={styles.cardTitle}>Update job</Text>
          <Field label="Service notes (optional)" value={notes} onChangeText={setNotes} placeholder="Work performed or next steps" multiline />
          {booking.status === 'Accepted' ? <Button title="Mark on the way" onPress={() => update('status', { status: 'On the Way', notes })} busy={busy} /> : null}
          {booking.status === 'On the Way' ? <Button title="Start service" onPress={() => update('status', { status: 'In Progress', notes })} busy={busy} /> : null}
          {booking.status === 'In Progress' ? <Button title="Complete service" onPress={() => update('status', { status: 'Completed', notes })} busy={busy} /> : null}
        </Card>
      ) : null}
      {booking.invoice ? <Card><Text style={styles.cardTitle}>Invoice</Text><Detail label={booking.invoice.invoice_number} value={money(booking.invoice.total)} /></Card> : null}
      <Button title="Refresh job" secondary onPress={load} />
    </Page>
  );
}

function NotificationsScreen() {
  const { request } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const result = await request('/notifications');
      setNotifications(result.notifications || []);
    } catch (err) {
      setError(errorText(err));
    }
  }, [request]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const markAll = async () => {
    try {
      await request('/notifications/read-all', { method: 'PUT' });
      await load();
    } catch (err) {
      Alert.alert('Could not mark notifications read', errorText(err));
    }
  };
  return (
    <Page onRefresh={load}>
      <View style={styles.rowBetween}><Heading title="Notifications" /><Pressable onPress={markAll}><Text style={styles.linkText}>Mark all read</Text></Pressable></View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {notifications.map((item) => (
        <Card key={item.id} style={!item.is_read ? styles.unreadCard : null}>
          <Text style={styles.cardTitle}>{item.title || item.type || 'Update'}</Text>
          <Text style={styles.bodyText}>{item.message || item.content || 'You have a new update.'}</Text>
          <Text style={styles.helper}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
          {!item.is_read ? <Pressable onPress={async () => { await request(`/notifications/${item.id}/read`, { method: 'PUT' }); await load(); }}><Text style={styles.linkText}>Mark as read</Text></Pressable> : null}
        </Card>
      ))}
      {!notifications.length ? <Empty title="You're all caught up" text="New booking updates will appear here." /> : null}
    </Page>
  );
}

function ProfileScreen() {
  const { user, request, logout, updateUser } = useApp();
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [specialization, setSpecialization] = useState(user.specialization || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saveProfile = async () => {
    setBusy(true);
    setError('');
    try {
      await request('/auth/profile', { method: 'PUT', body: { name, phone, specialization } });
      updateUser({ name, phone, specialization });
      Alert.alert('Profile saved', 'Your profile has been updated.');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const savePassword = async () => {
    setBusy(true);
    setError('');
    try {
      await request('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Password changed', 'Your password has been updated.');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Heading title="Profile" subtitle={`${user.role === 'technician' ? 'Technician' : 'Customer'} account`} />
      <Card>
        <Text style={styles.cardTitle}>Personal details</Text>
        <Detail label="Email" value={user.email} />
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        {user.role === 'technician' ? <Field label="Specialization" value={specialization} onChangeText={setSpecialization} /> : null}
        <Button title="Save profile" onPress={saveProfile} busy={busy} />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Change password</Text>
        <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <Button title="Update password" secondary onPress={savePassword} busy={busy} />
      </Card>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button title="Sign out" danger onPress={logout} />
    </Page>
  );
}

const customerTabs = [
  { name: 'HomeTab', label: 'Home', icon: '⌂' },
  { name: 'ServicesTab', label: 'Services', icon: '✦' },
  { name: 'BookingsTab', label: 'Bookings', icon: '▤' },
  { name: 'NotificationsTab', label: 'Alerts', icon: '♧' },
  { name: 'ProfileTab', label: 'Profile', icon: '◉' },
];
const techTabs = [
  { name: 'HomeTab', label: 'Home', icon: '⌂' },
  { name: 'JobsTab', label: 'Jobs', icon: '▣' },
  { name: 'NotificationsTab', label: 'Alerts', icon: '♧' },
  { name: 'ProfileTab', label: 'Profile', icon: '◉' },
];

function MainTabs() {
  const { user } = useApp();
  const screens = user.role === 'technician' ? techTabs : customerTabs;
  return (
    <Tabs.Navigator
      screenOptions={{
        headerTitle: 'SmartService',
        headerTitleStyle: { fontWeight: '800', color: '#17324e' },
        tabBarActiveTintColor: user.role === 'technician' ? GREEN : BRAND,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      {screens.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          component={item.name === 'HomeTab' ? HomeScreen : item.name === 'ServicesTab' ? ServicesScreen : item.name === 'BookingsTab' || item.name === 'JobsTab' ? BookingsScreen : item.name === 'NotificationsTab' ? NotificationsScreen : ProfileScreen}
          options={{ title: item.label, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{item.icon}</Text> }}
        />
      ))}
    </Tabs.Navigator>
  );
}

function AuthGate() {
  const { user, loading } = useApp();
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={BRAND} /></View>;
  if (!user) return <AuthScreen />;
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="CreateBooking" component={CreateBookingScreen} options={{ title: 'New booking' }} />
        <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Booking details' }} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [baseUrl, setBaseUrlState] = useState('http://localhost:5000/api');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const [savedToken, savedUser, savedUrl] = await Promise.all([
          SecureStore.getItemAsync('smartservice.token'),
          SecureStore.getItemAsync('smartservice.user'),
          SecureStore.getItemAsync('smartservice.apiUrl'),
        ]);
        if (savedUrl) setBaseUrlState(savedUrl);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Could not restore mobile session:', error);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const setBaseUrl = (value) => {
    const normalized = value.trim().replace(/\/+$/, '');
    setBaseUrlState(normalized);
    SecureStore.setItemAsync('smartservice.apiUrl', normalized).catch((error) => console.error('Could not save API address:', error));
  };

  const request = useCallback(async (path, options = {}) => {
    const url = `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
    let response;
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });
    } catch {
      throw new Error('Could not reach the API. Check the API address and ensure your phone and computer are on the same network.');
    }
    let result = {};
    try {
      result = await response.json();
    } catch {
      throw new Error('The server returned an unreadable response.');
    }
    if (response.status === 401) {
      await Promise.all([SecureStore.deleteItemAsync('smartservice.token'), SecureStore.deleteItemAsync('smartservice.user')]);
      setToken(null);
      setUser(null);
    }
    if (!response.ok || result.success === false) throw new Error(result.message || `Request failed (${response.status}).`);
    return result;
  }, [baseUrl, token]);

  const authenticate = async (path, payload) => {
    const result = await request(path, { method: 'POST', body: payload });
    if (!['customer', 'technician'].includes(result.user?.role)) {
      throw new Error('The mobile app is for customer and technician accounts. Use the web app for administrator access.');
    }
    await Promise.all([
      SecureStore.setItemAsync('smartservice.token', result.token),
      SecureStore.setItemAsync('smartservice.user', JSON.stringify(result.user)),
    ]);
    setToken(result.token);
    setUser(result.user);
  };
  const signIn = (email, password) => authenticate('/auth/login', { email: email.trim(), password });
  const signUp = ({ name, email, password, phone, role, specialization }) => authenticate('/auth/register', { name, email: email.trim(), password, phone, role, specialization });
  const logout = async () => {
    await Promise.all([SecureStore.deleteItemAsync('smartservice.token'), SecureStore.deleteItemAsync('smartservice.user')]);
    setToken(null);
    setUser(null);
  };
  const updateUser = (updates) => {
    setUser((current) => {
      const updated = { ...current, ...updates };
      SecureStore.setItemAsync('smartservice.user', JSON.stringify(updated)).catch((error) => console.error('Could not save profile:', error));
      return updated;
    });
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Ctx.Provider value={{ user, token, loading, baseUrl, setBaseUrl, request, signIn, signUp, logout, updateUser }}>
        <AuthGate />
      </Ctx.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  authRoot: { flex: 1, backgroundColor: '#f1f6fb' },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brandMark: { alignSelf: 'center', width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND, marginBottom: 12 },
  brandMarkText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  brandTitle: { textAlign: 'center', color: '#17324e', fontSize: 28, fontWeight: '900' },
  authSubtitle: { textAlign: 'center', color: MUTED, marginTop: 6, marginBottom: 20 },
  authCard: { padding: 20 },
  sectionTitle: { color: '#18334e', fontWeight: '800', fontSize: 20, marginBottom: 16 },
  page: { padding: 16, paddingBottom: 36, gap: 12, backgroundColor: '#f6f8fb', flexGrow: 1 },
  heading: { marginBottom: 2 },
  headingTitle: { fontSize: 23, lineHeight: 29, fontWeight: '800', color: '#17324e' },
  headingSubtitle: { color: MUTED, fontSize: 14, marginTop: 3 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e8edf3', gap: 8 },
  cardTitle: { color: '#1d344c', fontWeight: '700', fontSize: 16, flexShrink: 1 },
  bodyText: { color: '#34485e', fontSize: 14, lineHeight: 20 },
  muted: { color: MUTED, fontSize: 13, lineHeight: 19 },
  price: { fontSize: 15, fontWeight: '800', color: BRAND, marginTop: 3 },
  label: { fontSize: 13, color: '#40556b', fontWeight: '700', marginTop: 5 },
  fieldWrap: { gap: 5 },
  input: { borderRadius: 11, borderWidth: 1, borderColor: '#dfe6ee', backgroundColor: '#fff', paddingHorizontal: 13, paddingVertical: 12, color: '#1d344c', fontSize: 15 },
  multiline: { minHeight: 86, textAlignVertical: 'top' },
  helper: { color: MUTED, fontSize: 12, lineHeight: 18 },
  button: { minHeight: 48, backgroundColor: BRAND, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonCompact: { minHeight: 40, paddingVertical: 9 },
  buttonSecondary: { backgroundColor: '#eaf4fc' },
  buttonDanger: { backgroundColor: '#b93838' },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  buttonSecondaryText: { color: BRAND },
  pressed: { opacity: 0.8 },
  linkButton: { paddingVertical: 9, alignItems: 'center' },
  linkText: { color: BRAND, fontWeight: '700', fontSize: 13 },
  segment: { flexDirection: 'row', padding: 4, backgroundColor: '#eef3f7', borderRadius: 12 },
  segmentItem: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 9 },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { color: MUTED, fontWeight: '700' },
  segmentTextActive: { color: BRAND },
  status: { overflow: 'hidden', fontSize: 11, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyTitle: { color: '#263e57', fontWeight: '800', fontSize: 16, marginBottom: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '48%', minHeight: 76, justifyContent: 'center' },
  statValue: { color: '#17324e', fontWeight: '800', fontSize: 18 },
  filters: { flexGrow: 0, maxHeight: 42 },
  filter: { borderWidth: 1, borderColor: '#dce4ec', backgroundColor: '#fff', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 22, marginRight: 7 },
  filterActive: { borderColor: BRAND, backgroundColor: BRAND },
  filterText: { color: MUTED, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  choice: { borderWidth: 1, borderColor: '#e2e8ef', borderRadius: 12, padding: 12, backgroundColor: '#fff', marginBottom: 7 },
  choiceSelected: { borderColor: BRAND, backgroundColor: '#f0f8ff' },
  errorText: { color: '#b93838', fontSize: 14, lineHeight: 20 },
  detail: { borderTopWidth: 1, borderTopColor: '#edf1f5', paddingTop: 8, gap: 2 },
  buttonRow: { gap: 6 },
  unreadCard: { borderColor: '#8dc2ed', backgroundColor: '#f5faff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
