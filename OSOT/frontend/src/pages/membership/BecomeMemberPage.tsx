/**
 * Become a Member Page
 * Shown to users who don't have an active membership
 */

import { Shield, Calendar, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function BecomeMemberPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-100 dark:bg-brand-900 rounded-full mb-6">
            <Users className="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Become a Member
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join OSOT and unlock exclusive benefits, resources, and professional development opportunities designed for occupational therapy professionals in Ontario.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Professional Recognition
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Be recognized as a certified OT professional in Ontario with full membership status.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Insurance Coverage
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Access professional liability insurance and comprehensive coverage options.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Events & Workshops
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Exclusive access to professional development events, conferences, and workshops.
            </p>
          </div>
        </div>

        {/* Membership Features */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 mb-12 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What's Included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Access to professional resources and guidelines',
              'Networking opportunities with OT professionals',
              'Continuing education credits and courses',
              'Member-only publications and research',
              'Job board and career development support',
              'Advocacy and representation at provincial level',
              'Professional liability insurance options',
              'Discounts on events and educational materials',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl p-8 md:p-12 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join?
            </h2>
            <p className="text-brand-100 mb-8 max-w-2xl mx-auto">
              Start your membership journey today and become part of Ontario's leading occupational therapy community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-brand-600 hover:bg-brand-50 font-semibold px-8"
                asChild
              >
                <Link to="/membership/apply">
                  Apply for Membership
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white hover:text-brand-600 font-semibold px-8"
                asChild
              >
                <Link to="/membership/renew">
                  Renew Membership
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Have questions about membership?
          </p>
          <Button variant="link" className="text-brand-600 dark:text-brand-400" asChild>
            <Link to="/contact">
              Contact our membership team →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
