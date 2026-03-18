import React from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import ResultScreen from './screens/ResultScreen';
import EmergencyOverlay from './components/EmergencyOverlay';
import BackgroundCanvas from './components/BackgroundCanvas';

function AppRouter() {
    const { screen, isEmergency } = useSession();

    return (
        <div className="relative min-h-screen font-sans overflow-hidden">
            <BackgroundCanvas />

            {/* Grid overlay */}
            <div className="fixed inset-0 grid-overlay opacity-30 pointer-events-none z-0" />

            {/* Main content */}
            <div className="relative z-10">
                {screen === 'home' && <HomeScreen />}
                {screen === 'chat' && <ChatScreen />}
                {screen === 'result' && <ResultScreen />}
            </div>

            {/* Emergency overlay */}
            {isEmergency && <EmergencyOverlay />}
        </div>
    );
}

export default function App() {
    return (
        <SessionProvider>
            <AppRouter />
        </SessionProvider>
    );
}
