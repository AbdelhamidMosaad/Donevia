'use client';

import React, { useRef, useEffect } from 'react';
import { Rect, Text, Line, Group, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { WhiteboardNode } from '@/lib/types';

interface WhiteboardNodeComponentProps {
  node: WhiteboardNode;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onChange: (newAttrs: Partial<WhiteboardNode>) => void;
  onDragEnd: () => void;
  onDelete: () => void;
}

export function WhiteboardNodeComponent({
  node,
  isSelected,
  isEditing,
  onSelect,
  onDoubleClick,
  onChange,
  onDragEnd,
  onDelete,
}: WhiteboardNodeComponentProps) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

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
    const newAttrs = {
      x: shape.x(),
      y: shape.y(),
      width: shape.width() * shape.scaleX(),
      height: shape.height() * shape.scaleY(),
      rotation: shape.rotation(),
    };
    onChange(newAttrs);
    onDragEnd();
  };
  
  const renderShape = () => {
    switch (node.type) {
      case 'pen':
        return (
          <Line
            points={node.points}
            stroke={node.color}
            strokeWidth={node.strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        );
      case 'text':
        return (
            <Text
              text={node.text || 'Type here'}
              fontSize={node.fontSize}
              fill={node.color}
              fontStyle={node.isItalic ? 'italic' : 'normal'}
              textDecoration={node.isUnderline ? 'underline' : 'none'}
              fontFamily='sans-serif'
              padding={5}
            />
        );
      case 'sticky':
        return (
            <>
                <Rect
                    width={node.width}
                    height={node.height}
                    fill={node.color || '#ffd166'}
                    cornerRadius={6}
                    shadowBlur={10}
                    shadowOpacity={0.3}
                />
                 <Text
                    text={node.text || 'Sticky note'}
                    fontSize={node.fontSize}
                    fill={node.color ? '#FFFFFF' : '#333333'}
                    width={node.width}
                    padding={10}
                    verticalAlign="middle"
                />
            </>
        );
      case 'shape':
        if (node.shape === 'rectangle') {
            return (
                <Rect
                    width={node.width}
                    height={node.height}
                    fill={node.color}
                    stroke="#333333"
                    strokeWidth={node.strokeWidth}
                />
            );
        }
         if (node.shape === 'circle') {
            return (
                 <Rect
                    width={node.width}
                    height={node.height}
                    fill={node.color}
                    stroke="#333333"
                    strokeWidth={node.strokeWidth}
                />
            );
        }
        return null;
       default:
        return null;
    }
  }

  return (
    <>
      <Group
        ref={shapeRef}
        x={node.x}
        y={node.y}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        {renderShape()}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
