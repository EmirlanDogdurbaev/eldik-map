import { useRef, useState, useEffect } from "react";

export function useDraggableSidebar(visibleHead = 60) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startTr, setStartTr] = useState(0);

  function getClosed() {
    return (sidebarRef.current?.offsetHeight ?? 0) - visibleHead;
  }
  function setTr(y: number) {
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = `translateY(${y}px)`;
    }
  }
  function openPanel() {
    if (!sidebarRef.current) return;
    sidebarRef.current.style.transition = "";
    setTr(0);
    setIsOpen(true);
  }
  function closePanel() {
    if (!sidebarRef.current) return;
    sidebarRef.current.style.transition = "";
    setTr(getClosed());
    setIsOpen(false);
  }

  // Mount, resize
  useEffect(() => {
    if (window.innerWidth < 640) closePanel();
    else if (sidebarRef.current) sidebarRef.current.style.transform = "";
    const onResize = () => {
      if (window.innerWidth < 640) closePanel();
      else if (sidebarRef.current) sidebarRef.current.style.transform = "";
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line
  }, []);

  // Drag events
  useEffect(() => {
    if (!dragRef.current) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (window.innerWidth >= 640) return;
      setIsDragging(true);
      setStartY(e.clientY);
      const style = window.getComputedStyle(sidebarRef.current!);
      setStartTr(new DOMMatrixReadOnly(style.transform).m42);
      sidebarRef.current!.style.transition = "none";
      dragRef.current!.setPointerCapture(e.pointerId);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || window.innerWidth >= 640) return;
      const delta = e.clientY - startY;
      let newY = startTr + delta;
      const closedY = getClosed();
      newY = Math.min(Math.max(newY, 0), closedY);
      setTr(newY);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (window.innerWidth >= 640) return;
      setIsDragging(false);
      sidebarRef.current!.style.transition = "";
      dragRef.current!.releasePointerCapture(e.pointerId);
      const style = window.getComputedStyle(sidebarRef.current!);
      const currentY = new DOMMatrixReadOnly(style.transform).m42;
      if (currentY < getClosed() / 2) openPanel();
      else closePanel();
    };
    const dragElem = dragRef.current;
    dragElem.addEventListener("pointerdown", handlePointerDown);
    dragElem.addEventListener("pointermove", handlePointerMove);
    dragElem.addEventListener("pointerup", handlePointerUp);
    return () => {
      dragElem.removeEventListener("pointerdown", handlePointerDown);
      dragElem.removeEventListener("pointermove", handlePointerMove);
      dragElem.removeEventListener("pointerup", handlePointerUp);
    };
    // eslint-disable-next-line
  }, [isDragging, startY, startTr]);

  // Toggle by button
  useEffect(() => {
    if (!toggleRef.current) return;
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      isOpen ? closePanel() : openPanel();
    };
    const btn = toggleRef.current;
    btn.addEventListener("click", handleClick);
    return () => btn.removeEventListener("click", handleClick);
    // eslint-disable-next-line
  }, [isOpen]);

  return {
    sidebarRef,
    dragRef,
    toggleRef,
    isOpen,
    openPanel,
    closePanel,
  };
}
