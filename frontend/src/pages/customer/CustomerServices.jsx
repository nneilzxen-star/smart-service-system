import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { servicesAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { SkeletonCard, ErrorState, EmptyState } from '../../components/ui';
import { Search, Clock, ArrowRight, Layers } from 'lucide-react';

const CATEGORIES = ['All', 'HVAC', 'Electrical', 'Plumbing', 'Appliance', 'IT', 'Cleaning', 'Security', 'Maintenance'];

const CustomerServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    setLoading(true); setError(null);
    servicesAPI.getAll()
      .then(({ data }) => setServices(data.services || []))
      .catch(() => setError('Failed to load services.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = services.filter(s =>
    (category === 'All' || s.category === category) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 page-enter">
      <h1 className="page-title">Services</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === cat ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">{Array.from({length:5}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      ) : error ? <ErrorState message={error} />
      : filtered.length === 0 ? <EmptyState icon={Layers} title="No services found" description="Try a different search or category." />
      : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Link key={s.id} to={`/customer/book?service=${s.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-all active:scale-98 group">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Layers className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{s.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-primary-600">{formatCurrency(s.base_price)}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" /> {s.estimated_duration} min
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerServices;
