import html2canvas from 'html2canvas';
import { toast } from 'sonner';

/**
 * Takes a screenshot of an invoice element, temporarily removing
 * any ancestor CSS transforms (scale) to ensure clean capture.
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

  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor,
      logging: false,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
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
    // Restore transforms
    transformedAncestors.forEach(({ el, transform }) => {
      el.style.transform = transform;
    });
  }
};
