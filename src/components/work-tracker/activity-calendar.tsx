
'use client';

import { useState, useMemo } from 'react';
import type { WorkActivity } from '@/lib/types';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface ActivityCalendarProps {
    activities: WorkActivity[];
}

export function ActivityCalendar({ activities }: ActivityCalendarProps) {
    const events = useMemo(() => activities.map(activity => ({
        id: activity.id,
        title: `${activity.appointment}: ${activity.description}`,
        start: activity.date.toDate(),
        end: activity.date.toDate(),
        allDay: true,
        resource: activity
    })), [activities]);

    return (
        <div className="h-[calc(100vh-350px)] bg-card p-4 rounded-lg border">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
            />
        </div>
    );
}
