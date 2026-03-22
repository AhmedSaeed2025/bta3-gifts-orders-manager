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
          // Fix all table cells to prevent overlap
          const cells = clonedElement.querySelectorAll('td, th');
          cells.forEach((cell: Element) => {
            (cell as HTMLElement).style.overflow = 'visible';
            (cell as HTMLElement).style.wordBreak = 'break-word';
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
