'use client';

import React, { useRef, useEffect } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { WhiteboardNode } from '@/lib/types';
import useImage from 'use-image';
import dynamic from 'next/dynamic';

// Dynamically import react-konva components
const Group = dynamic(() => import('react-konva').then(m => m.Group), { ssr: false });
const Rect = dynamic(() => import('react-konva').then(m => m.Rect), { ssr: false });
const Text = dynamic(() => import('react-konva').then(m => m.Text), { ssr: false });
const Line = dynamic(() => import('react-konva').then(m => m.Line), { ssr: false });
const Arrow = dynamic(() => import('react-konva').then(m => m.Arrow), { ssr: false });
const Transformer = dynamic(() => import('react-konva').then(m => m.Transformer), { ssr: false });
const RegularPolygon = dynamic(() => import('react-konva').then(m => m.RegularPolygon), { ssr: false });
const KonvaImage = dynamic(() => import('react-konva').then(m => m.Image), { ssr: false });
const Html = dynamic(() => import('react-konva-utils').then(m => m.Html), { ssr: false });


interface WhiteboardNodeComponentProps {
  node: WhiteboardNode;
  isSelected: boolean;
  isEditing: boolean;
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'arrow' | 'connect' | 'image' | 'mindmap';
  onSelect: () => void;
  onDoubleClick: () => void;
  onChange: (newAttrs: Partial<WhiteboardNode>) => void;
  onDragEnd: () => void;
}

export function WhiteboardNodeComponent({
  node,
  isSelected,
  isEditing,
  tool,
  onSelect,
  onDoubleClick,
  onChange,
  onDragEnd,
}: WhiteboardNodeComponentProps) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image] = useImage(node.src || '', 'anonymous');

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    onChange({ x: e.target.x(), y: e.target.y() });
    onDragEnd();
  };

  const handleTransformEnd = () => {
    const shape = shapeRef.current;
    if (shape) {
      const newAttrs = {
        x: shape.x(),
        y: shape.y(),
        width: shape.width() * shape.scaleX(),
        height: shape.height() * shape.scaleY(),
        rotation: shape.rotation(),
      };
      shape.scaleX(1);
      shape.scaleY(1);
      onChange(newAttrs);
      onDragEnd();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ text: e.target.value });
  };
  
  const renderShape = () => {
    const { type, shape, points, color, strokeWidth, width = 0, height = 0, text, fontSize, src } = node;

    if (type === 'pen' && points) {
        if(node.isArrow) {
            return <Arrow points={points} stroke={color} strokeWidth={strokeWidth} lineCap="round" lineJoin="round" pointerLength={strokeWidth ? strokeWidth * 2 : 8} pointerWidth={strokeWidth ? strokeWidth * 2 : 8} />
        }
      return (
        <Line
          points={points}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={0.5}
        />
      );
    }
    
    if (type === 'sticky') {
        return (
            <Group>
                <Rect
                    width={width}
                    height={height}
                    fill={color || '#ffd166'}
                    cornerRadius={6}
                    shadowBlur={10}
                    shadowOpacity={0.3}
                />
                 <Text
                    text={isEditing ? '' : text}
                    fontSize={fontSize}
                    fill={'#333333'}
                    width={width}
                    height={height}
                    padding={10}
                    verticalAlign="middle"
                    align="center"
                />
            </Group>
        )
    }
    
    if (type === 'text') {
        return (
             <Text
                text={isEditing ? '' : text}
                fontSize={fontSize}
                fill={color}
                width={width}
                height={height}
                padding={5}
                verticalAlign="middle"
                align="center"
            />
        )
    }

    if (type === 'shape') {
        const commonProps = {
            width: width,
            height: height,
            fill: color,
            stroke: "#333333",
            strokeWidth: strokeWidth,
        };
        switch(shape) {
            case 'rectangle':
                return <Rect {...commonProps} />;
            case 'circle':
                 return <Rect {...commonProps} cornerRadius={width / 2} />;
            case 'triangle':
                return <RegularPolygon {...commonProps} sides={3} radius={width / 2} />;
            case 'diamond':
                 return <RegularPolygon {...commonProps} sides={4} radius={width / 2} />;
            case 'arrow-right':
                 return <Arrow points={[0, height/2, width - 10, height/2]} pointerLength={10} pointerWidth={10} fill={color} stroke={color} strokeWidth={height / 2} />;
            case 'arrow-left':
                 return <Arrow points={[width, height/2, 10, height/2]} pointerLength={10} pointerWidth={10} fill={color} stroke={color} strokeWidth={height / 2} />;
            default:
                return null;
        }
    }
    if (type === 'image' && src) {
      return <KonvaImage image={image} width={width} height={height} />;
    }
    return null;
  }

  const getTextAreaStyle = (): React.CSSProperties => {
    const shape = shapeRef.current;
    if (!shape) return { display: 'none' };
    
    const rotation = shape.rotation() || 0;
    
    return {
        display: isEditing ? 'block' : 'none',
        position: 'absolute',
        top: `${shape.y()}px`,
        left: `${shape.x()}px`,
        width: `${shape.width()}px`,
        height: `${shape.height()}px`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        background: 'none',
        border: '1px solid #6D28D9',
        outline: 'none',
        resize: 'none',
        fontSize: `${node.fontSize || 16}px`,
        color: node.type === 'sticky' ? '#333333' : node.color,
        padding: '10px',
        lineHeight: 1.5,
        textAlign: 'center',
    }
  }

  return (
    <React.Suspense fallback={null}>
      <Group
        ref={shapeRef}
        id={node.id}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        draggable={tool === 'select' && !isEditing}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        rotation={node.rotation || 0}
      >
        {renderShape()}
        {tool === 'connect' && (
          <>
            <Rect x={-5} y={node.height! / 2 - 5} width={10} height={10} fill="dodgerblue" cornerRadius={5} />
            <Rect x={node.width! / 2 - 5} y={-5} width={10} height={10} fill="dodgerblue" cornerRadius={5} />
            <Rect x={node.width! - 5} y={node.height! / 2 - 5} width={10} height={10} fill="dodgerblue" cornerRadius={5} />
            <Rect x={node.width! / 2 - 5} y={node.height! - 5} width={10} height={10} fill="dodgerblue" cornerRadius={5} />
          </>
        )}
      </Group>
      {isSelected && tool === 'select' && !isEditing && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
      {isEditing && (node.type === 'text' || node.type === 'sticky') && (
        <Html>
            <textarea
                value={node.text}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                    if(e.key === 'Escape') {
                        onEditNode(null);
                        onDragEnd();
                    }
                }}
                style={getTextAreaStyle()}
            />
        </Html>
      )}
    </React.Suspense>
  );
}
