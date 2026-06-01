import { toPng } from 'html-to-image';
import { toast } from 'sonner';

/**
 * Captures an invoice element as a PNG.
 * Uses `html-to-image` (SVG <foreignObject>) instead of html2canvas because
 * html2canvas breaks Arabic glyph shaping/ligatures during rasterization.
 */
export const captureInvoiceScreenshot = async (
  element: HTMLElement,
  serial: string,
  backgroundColor = '#ffffff'
) => {
  // Temporarily neutralize ancestor transforms (e.g. preview scale)
  const transformedAncestors: { el: HTMLElement; transform: string }[] = [];
  let parent = element.parentElement;
  while (parent) {
    const computed = window.getComputedStyle(parent);
    if (computed.transform && computed.transform !== 'none') {
      transformedAncestors.push({ el: parent, transform: parent.style.transform });
      parent.style.transform = 'none';
    }
    parent = parent.parentElement;
  }

  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalPosition = element.style.position;

  // Lock width so the SVG snapshot matches the on-screen layout
  const targetWidth = element.dataset.invoiceWidth
    ? parseInt(element.dataset.invoiceWidth, 10)
    : element.offsetWidth || 420;
  element.style.width = `${targetWidth}px`;
  element.style.maxWidth = `${targetWidth}px`;
  element.style.position = 'relative';

  try {
    // Make sure fonts (especially Arabic) and images are ready
    if ((document as any).fonts?.ready) {
      try { await (document as any).fonts.ready; } catch {}
    }
    const images = element.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
    await new Promise((r) => setTimeout(r, 250));

    const dataUrl = await toPng(element, {
      pixelRatio: 3,
      backgroundColor,
      cacheBust: true,
      width: targetWidth,
      height: element.scrollHeight,
      style: {
        width: `${targetWidth}px`,
        maxWidth: `${targetWidth}px`,
        transform: 'none',
      },
      // Skip failing external images instead of aborting capture
      skipFonts: false,
      filter: () => true,
    });

    const link = document.createElement('a');
    link.download = `فاتورة-${serial}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('تم حفظ صورة الفاتورة');
  } catch (error) {
    console.error('Screenshot error:', error);
    toast.error('حدث خطأ أثناء حفظ الصورة');
  } finally {
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.position = originalPosition;
    transformedAncestors.forEach(({ el, transform }) => {
      el.style.transform = transform;
    });
  }
};
