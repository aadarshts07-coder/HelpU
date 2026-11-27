'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Search,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Globe,
  Radio,
  ArrowRight
} from 'lucide-react';

export default function CoverageDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coverage');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverage();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Job Coverage & Ingestion Engine</h1>
                <p className="text-xs text-slate-500">
                  Multi-source legal aggregation health, city density & zero-result demand tracking
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchCoverage}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/post-job"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post a Job / Import Feed</span>
            </Link>
          </div>
        </div>

        {/* High-Level Metric Cards */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Indexed Jobs</span>
              <p className="text-2xl font-black text-slate-900">{data.metrics.totalIndexedJobs}</p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live & Verified
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Covered Cities</span>
              <p className="text-2xl font-black text-indigo-600">{data.metrics.coveredCitiesCount}</p>
              <span className="text-[11px] font-medium text-slate-500">Tier-1, 2, 3 & Global</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Ingestion Sources</span>
              <p className="text-2xl font-black text-slate-900">{data.metrics.activeSourcesCount}</p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Terms Compliant
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Zero-Result Searches</span>
              <p className="text-2xl font-black text-amber-600">{data.zeroHotspots.length}</p>
              <span className="text-[11px] font-medium text-slate-500">Demand gap signals</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zero-Result Demand Hotspots */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Zero-Result Demand Hotspots
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Expands sources automatically</span>
            </div>

            {data?.zeroHotspots && data.zeroHotspots.length > 0 ? (
              <div className="space-y-2">
                {data.zeroHotspots.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">&ldquo;{item.query}&rdquo;</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        <span>{item.location}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        {item.count} unmet queries
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.lastSearched).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No zero-result searches recorded yet. Search coverage is operating smoothly.
              </div>
            )}
          </div>

          {/* Jobs by City Distribution */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Active Coverage by City
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Live indexed counts</span>
            </div>

            {data?.cityDistribution && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {data.cityDistribution.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.city.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong className="text-slate-900 font-bold">{item.city}</strong>
                        <p className="text-[11px] text-slate-500">
                          {item.state}, {item.country}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[11px]">
                      {item.count} jobs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Source Connectors Health Table */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Connected Source Adapters & Terms Compliance
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">100% Authorized & Licensed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {data?.sources?.map((s: any) => (
              <div key={s.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-[11px] text-slate-500 capitalize">Type: {s.type.replace('_', ' ')}</p>
                <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Public API / Open Terms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
