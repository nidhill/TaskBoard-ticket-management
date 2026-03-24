import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SocketContextType {
    socket: Socket | null;
    joinTicketRoom: (ticketId: string) => void;
    leaveTicketRoom: (ticketId: string) => void;
}

const SocketContext = createContext<SocketContextType>({ socket: null, joinTicketRoom: () => {}, leaveTicketRoom: () => {} });

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!user) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const socket = io(API_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join', user.id);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    const joinTicketRoom = (ticketId: string) => {
        socketRef.current?.emit('join_ticket', ticketId);
    };

    const leaveTicketRoom = (ticketId: string) => {
        socketRef.current?.emit('leave_ticket', ticketId);
    };

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, joinTicketRoom, leaveTicketRoom }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
