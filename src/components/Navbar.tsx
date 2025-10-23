import Link from 'next/link';
import Button from './ui/Button';

export default function Navbar() {
  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MoodPilot
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href="/entry/new">
              <Button variant="ghost" size="sm">
                📝 New Entry
              </Button>
            </Link>
            <Link href="/stats">
              <Button variant="ghost" size="sm">
                📊 Stats
              </Button>
            </Link>
            <Link href="/goals">
              <Button variant="ghost" size="sm">
                🎯 Goals
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                ⚙️ Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}



