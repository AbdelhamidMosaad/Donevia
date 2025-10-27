
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Download, Save, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { MindMapResponse, MindMapNode as ResponseNode } from '@/lib/types/mindmap-generator';
import { generateMindMap } from '@/ai/flows/mind-map-flow';
import { addMindMap, updateMindMap } from '@/lib/mind-maps';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { MindMapNode } from '@/lib/types';


interface MindMapGeneratorProps {
  result: MindMapResponse | null;
  setResult: (result: MindMapResponse | null) => void;
}

const colors = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f97316', '#ef4444'];

const MindMapVisualizer = ({ data }: { data: MindMapResponse }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const drawMindMap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
        ctx.scale(zoom, zoom);

        const drawNode = (node: { text: string, x: number, y: number, color: string, children: any[] }, isRoot = false) => {
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.roundRect(node.x - 75, node.y - 20, 150, 40, 10);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = `${isRoot ? 'bold ' : ''}14px Poppins`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.text, node.x, node.y);
        };

        const drawLine = (from: {x:number, y:number}, to: {x:number, y:number}) => {
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        };
        
        const rootNode = { text: data.centralTopic, x: 0, y: 0, color: colors[0], children: data.mainBranches };
        drawNode(rootNode, true);

        const drawnPositions = new Set<string>();

        const traverse = (node: { text: string, x: number, y: number, color: string, children: any[] }, angleOffset: number, radius: number, depth: number) => {
            node.children.forEach((child, index) => {
                const angle = angleOffset + (index / node.children.length) * (Math.PI * 1.5) - (Math.PI / 2) * 1.5 / 2;
                
                const childX = node.x + Math.cos(angle) * radius;
                const childY = node.y + Math.sin(angle) * radius;

                if (drawnPositions.has(`${childX},${childY}`)) return;
                drawnPositions.add(`${childX},${childY}`);
                
                const childNode = { text: child.text, x: childX, y: childY, color: colors[depth % colors.length], children: child.children || [] };

                drawLine(node, childNode);
                drawNode(childNode);

                if (child.children) {
                    traverse(childNode, angle - Math.PI / 4, radius * 0.7, depth + 1);
                }
            });
        };

        traverse(rootNode, 0, 250, 1);
        ctx.restore();
    }, [data, zoom, pan]);

    useEffect(() => {
        drawMindMap();
    }, [drawMindMap]);
    
    return (
        <div className="w-full h-full relative">
            <canvas ref={canvasRef} className="w-full h-full rounded-md border" />
            <div className="absolute top-2 right-2 flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => z * 1.2)}><ZoomIn/></Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => z / 1.2)}><ZoomOut/></Button>
                <Button variant="outline" size="icon" onClick={() => { setZoom(1); setPan({x:0, y:0})}}><Maximize/></Button>
            </div>
        </div>
    )
}

export function MindMapGenerator({ result, setResult }: MindMapGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleGenerate = async (values: InputFormValues) => {
    if (!user) return;
    setIsLoading(true);
    setResult(null);
    try {
      const data = await generateMindMap({ sourceText: values.sourceText });
      setResult(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveMindMap = async () => {
    if(!result || !user) return;
    setIsSaving(true);
    
    try {
        const convertToMindMapNodes = (responseNodes: ResponseNode[], parentId: string | null, parentX: number, parentY: number, angleOffset: number, radius: number, depth: number): Record<string, MindMapNode> => {
            let mindMapNodes: Record<string, MindMapNode> = {};
            responseNodes.forEach((node, index) => {
                 const angle = angleOffset + (index / responseNodes.length) * (Math.PI * 1.5) - (Math.PI / 2) * 1.5 / 2;
                
                const x = parentX + Math.cos(angle) * radius;
                const y = parentY + Math.sin(angle) * radius;
                
                const newNodeId = uuidv4();
                
                mindMapNodes[newNodeId] = {
                    id: newNodeId,
                    text: node.text,
                    x, y, parentId,
                    children: [],
                    collapsed: false,
                    color: colors[depth % colors.length],
                    shape: 'rounded',
                    fontSize: Math.max(14, 18 - depth * 2),
                    bold: false,
                    width: 150
                };
                
                if (node.children) {
                    const childrenNodes = convertToMindMapNodes(node.children, newNodeId, x, y, angle - Math.PI / 4, radius * 0.7, depth + 1);
                    mindMapNodes = {...mindMapNodes, ...childrenNodes};
                    mindMapNodes[newNodeId].children = Object.values(childrenNodes).filter(c => c.parentId === newNodeId).map(c => c.id);
                }
            });
            return mindMapNodes;
        };

        const rootId = '1';
        const rootNode: MindMapNode = {
            id: rootId, text: result.centralTopic,
            x: 0, y: 0, parentId: null, children: [], collapsed: false,
            color: colors[0], shape: 'rounded', fontSize: 18, bold: true, width: 200
        };

        let allNodes: Record<string, MindMapNode> = { [rootId]: rootNode };
        const mainBranchNodes = convertToMindMapNodes(result.mainBranches, rootId, 0, 0, 0, 250, 1);
        allNodes = { ...allNodes, ...mainBranchNodes };
        allNodes[rootId].children = Object.values(mainBranchNodes).filter(n => n.parentId === rootId).map(n => n.id);
        
        const connections = Object.values(allNodes)
            .filter(n => n.parentId)
            .map(n => ({ from: n.parentId!, to: n.id, color: '#9ca3af', strokeWidth: 2 }));

        const newMapRef = await addMindMap(user.uid, result.centralTopic);
        await updateMindMap(user.uid, newMapRef.id, {
            name: result.centralTopic,
            nodes: allNodes,
            connections,
        });

        toast({ title: "Mind map saved!", description: "You can now edit it in the Mind Map tool." });
        router.push(`/mind-map/${newMapRef.id}`);

    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to save mind map.' });
    } finally {
        setIsSaving(false);
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50"><Loader2 className="h-16 w-16 text-primary animate-spin mb-4" /><h3 className="text-xl font-semibold font-headline">Generating Your Mind Map...</h3></div>;
    }
    if (result) {
      return (
        <Card className="flex-1 flex flex-col h-full">
            <CardHeader><CardTitle>{result.centralTopic}</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-0"><MindMapVisualizer data={result} /></CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => setResult(null)}>Generate New</Button>
                <Button onClick={handleSaveMindMap} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Save to Mind Maps
                </Button>
            </CardFooter>
        </Card>
      )
    }
    return <InputForm onGenerate={handleGenerate} generationType="mindmap" />;
  }

  return <div className="flex flex-col h-full gap-6">{renderContent()}</div>;
}
