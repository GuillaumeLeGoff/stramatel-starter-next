import React from "react";
import { SlideManager, SimpleSlideList } from "./SlideManager";

export function SlideManagerDemo() {
  return (
    <div className="p-4 flex flex-col space-y-8 max-w-screen-xl mx-auto">
      <section>
        <h2 className="text-xl font-bold mb-4">
          Gestionnaire de slides avec drag-and-drop
        </h2>
        <div className="h-[500px]">
          <SlideManager />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">
          Liste simple des slides (sans drag-and-drop)
        </h2>
        <div className="p-4 border rounded-lg">
          <SimpleSlideList />
        </div>
      </section>
    </div>
  );
}
