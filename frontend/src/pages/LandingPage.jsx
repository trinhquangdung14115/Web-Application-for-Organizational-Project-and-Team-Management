import { ArrowRight, Users, FolderKanban, BarChart3 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import logoIcon from '../assets/images/logo.png';
import logoText from '../assets/images/syncora-official.png';

export default function HomePage() {
    const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#f35640] rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-60 -left-40 w-96 h-96 bg-orange-600 rounded-full opacity-10 blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
          {/* --- LOGO: Icon + Chữ --- */}
        <div className="flex items-center gap-2 group cursor-pointer">
          {/* Logo Biểu tượng */}
            <img 
              src={logoIcon} 
              alt="Logo Icon" 
              className="w-14 h-14 object-contain transition-transform group-hover:scale-105" 
            />
            {/* Logo Chữ */}
            <img 
              src={logoText} 
              alt="Syncora Text" 
              className="h-8 pt-1 object-contain transition-transform group-hover:scale-105" 
            />
        </div>
          <button onClick={() => navigate("/login")}
                  className="px-6 py-2 border border-[#f35640] text-[#f35640] rounded-lg hover:bg-[#f35640] hover:text-black transition-all duration-300">
            Sign In
          </button>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-[#f35640]/10 border border-orange-500/20 rounded-full">
              <span className="text-[#f35640]">Transform Your Workflow</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl mb-6 bg-gradient-to-r from-white via-orange-100 to-[#f35640] bg-clip-text text-transparent">
              Manage Projects,
              <br />
              Empower Teams
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Streamline your project management and team collaboration with our powerful platform. 
              Built for teams who want to achieve more, together.
            </p>

            <button 
              onClick={() => navigate("/pricing")}
              className="group px-8 py-4 bg-[#f35640] text-black rounded-lg  transition-all duration-300 inline-flex items-center gap-2 shadow-lg shadow-brand/50"
            >
              <span className="text-lg">Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="mt-6 text-sm text-gray-500">
              No credit card required • Free 14-day trial
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-[#f35640]/50 transition-all duration-300">
            <div className="w-12 h-12 bg-[#f35640]/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-[#f35640]" />
            </div>
            <h3 className="text-xl mb-3">Team Collaboration</h3>
            <p className="text-gray-400">
              Work seamlessly with your team members. Share updates, assign tasks, and track progress in real-time.
            </p>
          </div>

          <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-[#f35640]/50 transition-all duration-300">
            <div className="w-12 h-12 bg-[#f35640]/10 rounded-lg flex items-center justify-center mb-4">
              <FolderKanban className="w-6 h-6 text-[#f35640]" />
            </div>
            <h3 className="text-xl mb-3">Project Management</h3>
            <p className="text-gray-400">
              Organize projects with intuitive boards. Create tasks, set deadlines, and manage workflows effortlessly.
            </p>
          </div>

          <div className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-[#f35640]/50 transition-all duration-300">
            <div className="w-12 h-12 bg-[#f35640]/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-[#f35640]" />
            </div>
            <h3 className="text-xl mb-3">Analytics & Insights</h3>
            <p className="text-gray-400">
              Get detailed insights into team performance. Track metrics and make data-driven decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-3xl p-12">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl text-[#f35640] mb-2">10k+</div>
              <div className="text-gray-400">Active Teams</div>
            </div>
            <div>
              <div className="text-4xl text-[#f35640] mb-2">500k+</div>
              <div className="text-gray-400">Projects Managed</div>
            </div>
            <div>
              <div className="text-4xl text-[#f35640] mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of teams already using Syncora to streamline their workflow
          </p>
          <button 
            onClick={() => navigate("/pricing")}
            className="group px-8 py-4 bg-[#f35640] text-black rounded-lg transition-all duration-300 inline-flex items-center gap-2 shadow-lg shadow-brand/50"
          >
            <span className="text-lg">Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center text-gray-500 text-sm">
            © 2025 Syncora. All rights reserved. H-town represent 
          </div>
        </div>
      </footer>
    </div>
  );
}
