import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { servicesAPI, bookingsAPI } from '../../services/api';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';
import { SuccessAnimation, Spinner } from '../../components/ui';
import { CheckCircle, ChevronRight, ChevronLeft, Calendar, Clock, MapPin, FileText, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Service', 'Details', 'Schedule', 'Location', 'Review', 'Confirm'];

const CreateBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    service_id: searchParams.get('service') || '',
    description: '',
    booking_date: '',
    booking_time: '',
    service_address: '',
  });
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    servicesAPI.getAll().then(({ data }) => {
      setServices(data.services || []);
      if (form.service_id) {
        const svc = data.services.find(s => s.id == form.service_id);
        if (svc) { setSelectedService(svc); setStep(1); }
      }
    });
  }, []);

  const selectService = (svc) => {
    setSelectedService(svc);
    setForm({ ...form, service_id: svc.id });
    setStep(1);
  };

  const next = () => {
    if (step === 1 && !form.description) { toast.error('Please describe your service need.'); return; }
    if (step === 2) {
      if (!form.booking_date) { toast.error('Please select a date.'); return; }
      if (!form.booking_time) { toast.error('Please select a time.'); return; }
      const d = new Date(form.booking_date);
      if (d < new Date(new Date().toDateString())) { toast.error('Please select a future date.'); return; }
    }
    if (step === 3 && !form.service_address) { toast.error('Please enter your service address.'); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.create(form);
      setSuccess(data);
      setStep(5);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 page-enter">
      <h1 className="page-title mb-2">Book a Service</h1>

      {/* Progress */}
      {step < 5 && (
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.slice(0, 5).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 flex-shrink-0 ${i <= step ? 'text-primary-600' : 'text-gray-300'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-100 text-primary-700 border-2 border-primary-500' : 'bg-gray-100 text-gray-400'}`}>
                  {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < 4 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="card">
        {/* Step 0: Select Service */}
        {step === 0 && (
          <div>
            <h2 className="section-title mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-primary-600" /> Select a Service</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {services.map((s) => (
                <button key={s.id} onClick={() => selectService(s)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500 truncate">{s.description}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600 flex-shrink-0">{formatCurrency(s.base_price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Description */}
        {step === 1 && (
          <div>
            <h2 className="section-title mb-1 flex items-center gap-2"><FileText className="w-5 h-5 text-primary-600" /> Service Details</h2>
            {selectedService && (
              <div className="bg-primary-50 rounded-xl p-3 mb-4 text-sm">
                <p className="font-medium text-primary-800">{selectedService.name}</p>
                <p className="text-primary-600">{formatCurrency(selectedService.base_price)} · {selectedService.estimated_duration} min</p>
              </div>
            )}
            <label className="label">Describe your issue or request *</label>
            <textarea className="input" rows={5} placeholder="e.g. My air conditioner is not cooling properly and making a loud noise..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div>
            <h2 className="section-title mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-600" /> Schedule</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Preferred Date *</label>
                <input type="date" className="input" min={minDate} value={form.booking_date}
                  onChange={(e) => setForm({ ...form, booking_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Preferred Time *</label>
                <input type="time" className="input" value={form.booking_time}
                  onChange={(e) => setForm({ ...form, booking_time: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div>
            <h2 className="section-title mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-600" /> Service Location</h2>
            <label className="label">Complete Service Address *</label>
            <textarea className="input" rows={3} placeholder="e.g. 123 Rizal Street, Barangay San Antonio, Makati City, Metro Manila"
              value={form.service_address} onChange={(e) => setForm({ ...form, service_address: e.target.value })} />
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="section-title mb-4">Review Booking</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{form.booking_date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">{form.booking_time}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-900 text-right max-w-xs">{form.service_address}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Description</span>
                <span className="font-medium text-gray-900 text-right max-w-xs line-clamp-2">{form.description}</span>
              </div>
              <div className="flex justify-between py-2 bg-primary-50 rounded-xl px-3">
                <span className="font-semibold text-gray-900">Estimated Cost</span>
                <span className="font-bold text-primary-600 text-lg">{formatCurrency(selectedService?.base_price)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && success && (
          <div className="text-center py-4">
            <SuccessAnimation message="Booking Confirmed!" />
            <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono font-bold text-primary-600">{success.booking_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-amber-600">{success.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated Cost</span>
                <span className="font-bold text-gray-900">{formatCurrency(success.estimated_cost)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">Our team will review your booking and assign a technician shortly.</p>
            <button onClick={() => navigate('/customer/bookings')} className="btn-primary mt-4 w-full">
              View My Bookings
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={next} className="btn-primary flex-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Booking
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBooking;
