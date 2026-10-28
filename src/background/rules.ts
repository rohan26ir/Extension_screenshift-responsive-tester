/**
 * DeclarativeNetRequest rule configurations to strip anti-framing headers
 * such as X-Frame-Options and Content-Security-Policy frame-ancestors.
 * This allows ScreenShift to embed websites in iframes without blocking.
 */

export const FRAME_BYPASS_RULE_ID = 1001;

export async function setupFrameRules(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
    console.warn('[ScreenShift] chrome.declarativeNetRequest API not available.');
    return;
  }

  try {
    const rules: chrome.declarativeNetRequest.Rule[] = [
      {
        id: FRAME_BYPASS_RULE_ID,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            {
              header: 'x-frame-options',
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: 'frame-options',
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: 'content-security-policy',
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: 'x-content-security-policy',
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
          ],
        },
        condition: {
          urlFilter: '*',
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.SUB_FRAME],
        },
      },
    ];

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [FRAME_BYPASS_RULE_ID],
      addRules: rules,
    });

    console.log('[ScreenShift] Anti-framing bypass rules active.');
  } catch (error) {
    console.error('[ScreenShift] Error configuring declarativeNetRequest rules:', error);
  }
}
