
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as React from 'react';

interface ToolbarTabsProps {
    children: React.ReactNode;
}

export function ToolbarTabs({ children }: ToolbarTabsProps) {
    const tabs = React.Children.toArray(children) as React.ReactElement[];
    return (
        <Tabs defaultValue={tabs[1].props.name} className="mt-2">
            <TabsList className="bg-transparent p-0 justify-start h-auto rounded-none border-b-0">
                {tabs.map(tab => (
                    <TabsTrigger 
                        key={tab.props.name} 
                        value={tab.props.name}
                        className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                        {tab.props.name}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabs.map(tab => (
                <TabsContent key={tab.props.name} value={tab.props.name} className="mt-0">
                    <div className="flex items-center gap-1 p-2 border-x border-b rounded-b-md bg-background flex-wrap">
                     {tab.props.children}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    )
}

export const Tab = ({ name, children }: { name: string, children: React.ReactNode }) => {
  return <>{children}</>;
};
