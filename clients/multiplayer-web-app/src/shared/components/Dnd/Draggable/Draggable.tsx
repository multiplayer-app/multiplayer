import { ReactNode } from "react";
import {
  Draggable as DraggableDnd,
  DraggableProvided,
  DraggableStateSnapshot,
} from "react-beautiful-dnd";

const grid = 0;

interface DraggableProps {
  children: ReactNode;
  className?: string;
  draggableId?: string;
  index?: number;
  draggingBackground?: string;
  direction?: "horizontal" | "vertical";
}

const Draggable = ({ children, ...props }: DraggableProps) => {
  const { draggableId, index, draggingBackground = 'auto', direction = 'horizontal' } = props;

  const getItemStyle = (isDragging: boolean, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: grid * 2,
    margin: `0 ${grid}px 0 0`,
    // change background colour if dragging
    background: isDragging ? draggingBackground : "transparent",
    // styles we need to apply on draggables
    ...draggableStyle,
  });

  return (
    <DraggableDnd key={draggableId} draggableId={draggableId} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
         let transform = provided.draggableProps.style.transform;
         let x = 0;
         if (transform) {
           let match = transform.match(/translate\(([^,]*),/);
           if (match) {
             x = parseFloat(match[1]); // Extract x translation
           }
         }
         const newStyle = {
            ...provided.draggableProps.style,
            transform: direction === 'horizontal' ? `translate(${x}px, 0px)` : `translate(0px, ${x}px)`,
          };
        return (
            <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getItemStyle(
                snapshot.isDragging,
                newStyle
            )}
          >
            {children}
          </div>
        )
        }}
    </DraggableDnd>
  );
};

export default Draggable;
