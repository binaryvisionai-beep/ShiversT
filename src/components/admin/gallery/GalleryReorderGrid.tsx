import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useState } from "react";

import { GalleryImageCard } from "@/components/admin/gallery/GalleryImageCard";
import { MasonryGallery } from "@/components/admin/gallery/MasonryGallery";
import type { GalleryImage } from "@/types/gallery";

type Props = {
  images: GalleryImage[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (image: GalleryImage) => void;
  onDelete: (image: GalleryImage) => void;
  onToggleVisible: (image: GalleryImage, visible: boolean) => void;
  onReorder: (orderedIds: string[]) => void;
};

export function GalleryReorderGrid({
  images,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onToggleVisible,
  onReorder,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...images];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onReorder(next.map((i) => i.id));
  };

  const activeImage = images.find((i) => i.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
        <MasonryGallery>
          {images.map((image) => (
            <GalleryImageCard
              key={image.id}
              image={image}
              selected={selectedIds.has(image.id)}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVisible={onToggleVisible}
            />
          ))}
        </MasonryGallery>
      </SortableContext>

      <DragOverlay>
        {activeImage ? (
          <div className="w-64 rounded-2xl border border-gold/40 shadow-lift overflow-hidden opacity-95 rotate-1">
            <img
              src={activeImage.image_url}
              alt=""
              className="aspect-[4/5] w-full object-cover"
              style={{ objectPosition: activeImage.object_position }}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
