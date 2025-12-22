'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeCreativeIcon } from '@/components/icons/tools/be-creative-icon';
import { BrainstormingIcon } from '@/components/icons/tools/brainstorming-icon';
import { WhiteboardIcon } from '@/components/icons/tools/whiteboard-icon';
import { MindMapIcon } from '@/components/icons/tools/mind-map-icon';

import BrainstormingPage from '../brainstorming/page';
import WhiteboardDashboardPage from '../whiteboard/page';
import MindMapDashboardPage from '../mind-map/page';

export default function BeCreativePage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <BeCreativeIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Be Creative</h1>
          <p className="text-muted-foreground">
            A suite of tools to brainstorm, visualize, and organize your ideas.
          </p>
        </div>
      </div>

      <Tabs defaultValue="brainstorming" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="brainstorming">
            <BrainstormingIcon className="mr-2 h-4 w-4" />
            Brainstorming
          </TabsTrigger>
          <TabsTrigger value="whiteboard">
            <WhiteboardIcon className="mr-2 h-4 w-4" />
            Whiteboard
          </TabsTrigger>
          <TabsTrigger value="mind-map">
            <MindMapIcon className="mr-2 h-4 w-4" />
            Mind Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brainstorming" className="flex-1 mt-4">
          <BrainstormingPage />
        </TabsContent>

        <TabsContent value="whiteboard" className="flex-1 mt-4">
          <WhiteboardDashboardPage />
        </TabsContent>

        <TabsContent value="mind-map" className="flex-1 mt-4">
          <MindMapDashboardPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
