import { test, expect } from '@playwright/test';
let sequence=0;
test.beforeEach(async({page})=>{await page.route('**/api/v1/**',async route=>{const req=route.request();const url=new URL(req.url());url.host='127.0.0.1:5002';await route.fulfill({response:await route.fetch({url:url.href})});});});
async function booking(request:import('@playwright/test').APIRequestContext,project:string,business_id='lumiere-mayfair') {
  const day=++sequence+(project==='mobile'?15:0);
  const response=await request.post('http://127.0.0.1:5002/__test__/booking',{data:{business_id,date:`2035-01-${String(day).padStart(2,'0')}`}});
  expect(response.ok()).toBeTruthy();return await response.json() as {id:string;management_url:string};
}
test('restaurant manage and cancel links perform real updates only after confirmation',async({page,request},info)=>{
  const b=await booking(request,info.project.name);await page.goto(b.management_url+'?action=cancel');
  await expect(page.getByRole('heading',{name:'Cancel this booking?'})).toBeVisible();
  await expect(page.getByText('confirmed',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Keep booking',exact:true}).click();
  await page.getByRole('button',{name:'Modify booking',exact:true}).click();
  await expect(page.getByLabel('Seating preference')).toBeVisible();
  await page.getByRole('button',{name:'8:00 PM',exact:true}).click();
  await page.getByRole('button',{name:'Save changes'}).click();
  await expect(page.getByRole('status')).toHaveText('Your booking has been updated.');
  await page.getByRole('button',{name:'Cancel booking',exact:true}).click();
  await page.getByRole('button',{name:'Confirm cancellation'}).click();
  await expect(page.getByText('cancelled',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Modify booking'})).toHaveCount(0);
});
test('gym management hides seating and provides calendar downloads',async({page,request},info)=>{
  const b=await booking(request,info.project.name,'site_pulsefit');await page.goto(b.management_url);
  await expect(page).toHaveTitle('PulseFit Studios · Manage booking');
  await expect(page.getByRole('link',{name:'View on Astryd Reserve map'})).toHaveAttribute('href', 'http://localhost:5174/search/site_pulsefit?focus=1&map=1');
  await expect(page.getByRole('heading',{name:'Contact'})).toBeVisible();
  await page.getByRole('button',{name:'Modify booking'}).click();
  await expect(page.getByLabel('Seating preference')).toHaveCount(0);
  const cal=page.getByRole('link',{name:'Apple',exact:true});expect(await cal.getAttribute('href')).toContain('/calendar.ics');
  await expect(page.getByRole('link',{name:'Google',exact:true})).toHaveAttribute('href',/calendar.google.com/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`/private/tmp/booking-management-${info.project.name}.png`,fullPage:true});
});
test('invalid private token shows no customer data or controls',async({page})=>{
  await page.goto('/s/lumiere-mayfair/reservation/'+ 'a'.repeat(43));
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await expect(page.getByRole('button',{name:'Cancel booking'})).toHaveCount(0);
});
test('email preview contains reference sections and working calendar/manage URLs',async({request,page},info)=>{
  const b=await booking(request,info.project.name);
  const login=await request.post('http://127.0.0.1:5002/api/v1/auth/login',{data:{orgId:'LUMIERE',email:'admin@lumiere.com',password:'admin123'}});
  const token=(await login.json()).token;
  const response=await request.get(`http://127.0.0.1:5002/api/v1/notifications/bookings/${b.id}?siteId=lumiere-mayfair&include_preview=1`,{headers:{Authorization:'Bearer '+token}});
  expect(response.ok()).toBeTruthy();const data=await response.json();expect(data.items[0].status).toBe('preview');
  await page.setContent(data.preview);
  await expect(page.getByRole('link',{name:'manage reservation',exact:true})).toHaveAttribute('href',b.management_url);
  await expect(page.getByRole('link',{name:'cancel reservation',exact:true})).toHaveAttribute('href',b.management_url+'?action=cancel');
  for(const name of ['Apple','Google','Outlook'])await expect(page.getByRole('link',{name,exact:true})).toBeVisible();
  await expect(page.getByText(/Your confirmation number is/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`/private/tmp/booking-email-${info.project.name}.png`,fullPage:true});
});
