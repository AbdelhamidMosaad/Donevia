
'use client';

import { useState, useEffect, createElement } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { StudyProfile, Badge } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import * as LucideIcons from 'lucide-react';

import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { badges, getXPForNextLevel, maxLevel } from '@/lib/gamification';


export function GamificationProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<StudyProfile | null>(null);

    useEffect(() => {
        if (!user) return;

        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const unsubscribe = onSnapshot(settingsRef, (doc) => {
            if (doc.exists() && doc.data().studyProfile) {
                setProfile(doc.data().studyProfile);
            } else {
                setProfile({
                    level: 1,
                    experiencePoints: 0,
                    earnedBadges: [],
                    currentStreak: 0,
                    longestStreak: 0,
                    lastStudyDay: '',
                });
            }
        });

        return () => unsubscribe();
    }, [user]);

    if (!profile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Loading profile...</p>
                </CardContent>
            </Card>
        );
    }
    
    const xpForNextLevel = getXPForNextLevel(profile.level);
    const xpForCurrentLevel = getXPForNextLevel(profile.level - 1);
    const xpInCurrentLevel = profile.experiencePoints - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const levelProgress = (xpInCurrentLevel / xpNeededForNext) * 100;
    
    const renderBadgeIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName];
        if (!IconComponent) return null;
        return createElement(IconComponent);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Track your progress and achievements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">Level {profile.level}</span>
                        <span className="text-sm text-muted-foreground">
                            {profile.level >= maxLevel ? 'Max Level!' : `${profile.experiencePoints} / ${xpForNextLevel} XP`}
                        </span>
                    </div>
                    <Progress value={profile.level >= maxLevel ? 100 : levelProgress} />
                </div>

                <div className="flex justify-around text-center">
                    <div>
                        <p className="text-2xl font-bold">{profile.currentStreak}</p>
                        <p className="text-sm text-muted-foreground">Current Streak</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{profile.longestStreak}</p>
                        <p className="text-sm text-muted-foreground">Longest Streak</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Badges</h4>
                    <div className="flex flex-wrap gap-4">
                        {profile.earnedBadges.length > 0 ? (
                           <TooltipProvider>
                                {profile.earnedBadges.map(badgeId => {
                                    const badge = badges[badgeId];
                                    return (
                                        <Tooltip key={badgeId}>
                                            <TooltipTrigger>
                                                <div className="p-2 bg-amber-100 text-amber-600 rounded-full border-2 border-amber-300">
                                                    {renderBadgeIcon(badge.icon as string)}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-bold">{badge.name}</p>
                                                <p>{badge.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                           </TooltipProvider>
                        ) : (
                            <p className="text-sm text-muted-foreground">No badges earned yet. Keep studying!</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
