

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
            <TabsList className="bg-muted/60 p-0 justify-start h-auto rounded-none border-b">
                {tabs.map(tab => (
                    <TabsTrigger
                        key={tab.props.name}
                        value={tab.props.name}
                        className="text-black data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-none rounded-t-md rounded-b-none border-b-0"
                    >
                        {tab.props.name}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabs.map(tab => (
                <TabsContent key={tab.props.name} value={tab.props.name} className="mt-0">
                    <div className="flex items-center justify-start gap-1 p-2 border-x border-b rounded-b-md bg-muted/60">
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
