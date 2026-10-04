import { test, expect } from '@playwright/test';
const home = process.env.PREMIUM_WEB_ORIGIN || 'http://127.0.0.1:3000';
const gaHome = 'http://127.0.0.1:3004';
const key = 'mojchatbot.analytics-consent.v2';

async function watchAnalytics(page) {
  const requests = [];
  page.on('request', request => {
    if (/googletagmanager|google-analytics|_vercel\/insights/.test(request.url())) requests.push(request.url());
  });
  await page.route('**/*googletagmanager.com/**', route => route.fulfill({contentType:'application/javascript', body:''}));
  await page.route('**/_vercel/insights/**', route => route.fulfill({contentType:'application/javascript', body:''}));
  return requests;
}

test('first visit blocks analytics, refusal persists and footer privacy links work', async ({page}) => {
  const requests = await watchAnalytics(page);
  await page.goto(home, {waitUntil:'networkidle'});
  await expect(page.getByRole('dialog', {name:'Vaše súkromie, vaša voľba.'})).toBeVisible();
  expect(requests).toEqual([]);
  await page.getByRole('button', {name:'Odmietnuť analytiku'}).click();
  await expect(page.getByRole('dialog', {name:'Vaše súkromie, vaša voľba.'})).toHaveCount(0);
  await page.reload({waitUntil:'networkidle'});
  expect(requests).toEqual([]);
  await expect(page.locator('html')).toHaveAttribute('data-analytics-consent','denied');
  const legal = page.getByRole('navigation', {name:'Právne odkazy'});
  await expect(legal.getByRole('link', {name:'Ochrana údajov', exact:true})).toHaveAttribute('href','/ochrana-udajov');
  await expect(legal.getByRole('link', {name:'Cookies', exact:true})).toHaveAttribute('href','/cookies');
  await expect(legal.getByRole('link', {name:'Právne informácie', exact:true})).toHaveAttribute('href','/pravne-informacie');
  await legal.getByRole('button', {name:'Nastavenia cookies'}).click();
  await expect(page.getByRole('button', {name:'Povoliť analytiku'})).toBeVisible();
  await page.getByRole('button', {name:'Odmietnuť analytiku'}).click();
  for (const route of ['/cookies','/ochrana-udajov','/pravne-informacie']) {
    const response = await page.goto(home+route,{waitUntil:'networkidle'});
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  }
  await page.goto(home+'/cookies',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Zmeniť nastavenie analytiky'}).click();
  await expect(page.getByRole('button',{name:'Odmietnuť analytiku'})).toBeVisible();
  await page.getByRole('button',{name:'Povoliť analytiku'}).click();
  await expect.poll(() => requests.filter(url=>url.includes('_vercel/insights')).length).toBe(1);
});

test('configured GA and Vercel load after consent and remain unloaded after withdrawal', async ({page, context}) => {
  const requests = await watchAnalytics(page);
  await page.goto(gaHome,{waitUntil:'networkidle'});
  expect(requests).toEqual([]);
  await page.getByRole('button',{name:'Povoliť analytiku'}).click();
  await expect.poll(() => requests.filter(url=>url.includes('googletagmanager')).length).toBe(1);
  await expect(page.locator('script[src*="vercel"][data-sdkn]')).toHaveCount(1);
  await context.addCookies([{name:'_ga',value:'test',url:gaHome}]);
  await page.getByRole('navigation',{name:'Právne odkazy'}).getByRole('button',{name:'Nastavenia cookies'}).click();
  await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Odmietnuť analytiku'}).click()]);
  await page.waitForLoadState('networkidle');
  const count=requests.length;
  await expect(page.locator('html')).toHaveAttribute('data-analytics-consent','denied');
  await expect(page.locator('script[data-ga-id]')).toHaveCount(0);
  expect((await context.cookies()).some(cookie=>cookie.name==='_ga')).toBe(false);
  await page.reload({waitUntil:'networkidle'});
  expect(requests).toHaveLength(count);
  const consent=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  expect(consent.value).toBe('denied');
});

test('expired consent prompts again and mobile choices stay within the viewport', async ({page}) => {
  await page.setViewportSize({width:360,height:640});
  await page.addInitScript(k=>localStorage.setItem(k,JSON.stringify({value:'granted',savedAt:Date.now()-181*86400000})),key);
  const requests=await watchAnalytics(page);
  await page.goto(home,{waitUntil:'networkidle'});
  expect(requests).toEqual([]);
  const banner=page.getByRole('dialog',{name:'Vaše súkromie, vaša voľba.'});
  await expect(banner).toBeVisible();
  for (const label of ['Odmietnuť analytiku','Povoliť analytiku']) {
    const box=await page.getByRole('button',{name:label}).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(360);
    expect(box.y+box.height).toBeLessThanOrEqual(640);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.screenshot({path:'/workspace/redesign-review/after/cookies-360.png'});
  await page.getByRole('button',{name:'Odmietnuť analytiku'}).click();
  await expect(page.getByTestId('widget-launcher')).toBeVisible();
});

test('withdrawing consent in another tab stops analytics in both tabs', async ({page, context}) => {
  await watchAnalytics(page);
  await page.goto(home,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Povoliť analytiku'}).click();
  const other = await context.newPage();
  const requests=await watchAnalytics(other);
  await other.goto(home,{waitUntil:'networkidle'});
  await expect(other.locator('html')).toHaveAttribute('data-analytics-consent','granted');
  await page.getByRole('navigation',{name:'Právne odkazy'}).getByRole('button',{name:'Nastavenia cookies'}).click();
  await Promise.all([page.waitForEvent('load'),other.waitForEvent('load'),page.getByRole('button',{name:'Odmietnuť analytiku'}).click()]);
  await other.waitForLoadState('networkidle');
  await expect(other.locator('html')).toHaveAttribute('data-analytics-consent','denied');
  const count=requests.length;
  await other.reload({waitUntil:'networkidle'});
  expect(requests).toHaveLength(count);
  await expect(other.locator('script[src*="insights"]')).toHaveCount(0);
});
