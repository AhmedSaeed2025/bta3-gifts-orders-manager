import html2canvas from 'html2canvas';
import { toast } from 'sonner';

/**
 * Takes a screenshot of an invoice element, temporarily removing
 * any ancestor CSS transforms (scale) and fixing rendering issues.
 */
export const captureInvoiceScreenshot = async (
  element: HTMLElement,
  serial: string,
  backgroundColor = '#ffffff'
) => {
  // Find all ancestors with transforms and temporarily remove them
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

  // Temporarily set fixed width to prevent layout shifts during capture
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalPosition = element.style.position;
  element.style.width = '420px';
  element.style.maxWidth = '420px';
  element.style.position = 'relative';

  try {
    // Wait for images to load and layout to settle
    const images = element.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor,
      logging: false,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('[data-invoice-ref="true"]') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.width = '420px';
          clonedElement.style.maxWidth = '420px';
          clonedElement.style.overflow = 'visible';
          clonedElement.style.position = 'relative';
          clonedElement.style.borderRadius = '0';
          
          // Fix all elements for html2canvas compatibility
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.overflow = 'visible';
            
            // Ensure table cells render text properly with centered alignment
            if (el.tagName === 'TD' || el.tagName === 'TH') {
              htmlEl.style.wordBreak = 'break-word';
              htmlEl.style.verticalAlign = 'middle';
              // Force line-height for consistent text positioning
              if (!htmlEl.style.lineHeight) {
                htmlEl.style.lineHeight = '1.5';
              }
              // Preserve background colors
              const computed = clonedDoc.defaultView?.getComputedStyle(htmlEl);
              if (computed?.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                htmlEl.style.backgroundColor = computed.backgroundColor;
              }
            }
            
            // Ensure images load with crossOrigin for html2canvas
            if (el.tagName === 'IMG') {
              (el as HTMLImageElement).crossOrigin = 'anonymous';
            }
          });
        }
      },
    });

    const link = document.createElement('a');
    link.download = `فاتورة-${serial}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    toast.success('تم حفظ صورة الفاتورة');
  } catch (error) {
    console.error('Screenshot error:', error);
    toast.error('حدث خطأ أثناء حفظ الصورة');
  } finally {
    // Restore original styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.position = originalPosition;
    // Restore transforms
    transformedAncestors.forEach(({ el, transform }) => {
      el.style.transform = transform;
    });
  }
};
