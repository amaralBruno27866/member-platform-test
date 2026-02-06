import { useNavigate } from 'react-router-dom';
import { Building2, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SelectUserTypePage() {
  const navigate = useNavigate();

  const userTypes = [
    {
      type: 'affiliate',
      title: 'Affiliate',
      description: 'Register as an organization or business affiliate',
      icon: Building2,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50 hover:bg-brand-100',
      borderColor: 'border-brand-200 hover:border-brand-300',
    },
    {
      type: 'professional',
      title: 'OT / OTA Professional',
      description: 'Register as an occupational therapist or assistant',
      icon: UserCog,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-200 hover:border-emerald-300',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-12">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Create Your Account</h1>
          <p className="text-xl text-gray-600">Choose the account type that best describes you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 px-8">
          {userTypes.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.type}
                className={`cursor-pointer transition-all duration-200 border-2 ${item.borderColor} ${item.bgColor} hover:shadow-2xl transform hover:scale-105`}
                onClick={() => navigate(`/register/${item.type}`)}
              >
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-6">
                    <div className={`p-6 rounded-full ${item.bgColor} ${item.color}`}>
                      <Icon className="w-16 h-16" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold mb-3">{item.title}</CardTitle>
                  <CardDescription className="text-lg mt-3">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <Button
                    size="lg"
                    className="w-full text-lg py-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/register/${item.type}`);
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-base text-gray-600">
            Already have an account?{' '}
            <Button
              variant="link"
              className="text-brand-600 hover:text-brand-700 p-0 h-auto font-semibold"
              onClick={() => navigate('/auth/login')}
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
