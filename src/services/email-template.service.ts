type TemplateInput = { eyebrow: string; title: string; greeting: string; paragraphs: string[]; actionLabel?: string; actionUrl?: string; actions?: { label:string; url:string; style?:"primary"|"secondary" }[]; accent?: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function textToParagraphs(value: string) {
  return value.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function brandedEmail(input: TemplateInput) {
  const accent = input.accent ?? "#ff535b";
  const paragraphs = input.paragraphs.map((paragraph) => `<p style="margin:0 0 18px;color:#d8c9ba;font-size:16px;line-height:1.7">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
  const actionItems = input.actions ?? (input.actionLabel && input.actionUrl ? [{label:input.actionLabel,url:input.actionUrl,style:"primary" as const}] : []);
  const action = actionItems.length ? `<div style="margin-top:8px">${actionItems.map((item)=>`<a href="${escapeHtml(item.url)}" style="display:inline-block;margin:0 8px 8px 0;padding:14px 20px;border:1px solid ${accent};background:${item.style==="secondary"?"transparent":accent};color:${item.style==="secondary"?"#e8d9c9":"#090909"};text-decoration:none;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em">${escapeHtml(item.label)}</a>`).join("")}</div>` : "";
  return `<!doctype html><html><body style="margin:0;background:#080808;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080808;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#111;border:1px solid #7f1d1d"><tr><td style="height:5px;background:${accent}"></td></tr><tr><td style="padding:34px"><p style="margin:0 0 12px;color:${accent};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.2em">${escapeHtml(input.eyebrow)}</p><h1 style="margin:0 0 24px;color:#e8d9c9;font-size:34px;line-height:1.15;text-transform:uppercase">${escapeHtml(input.title)}</h1><p style="margin:0 0 18px;color:#fff;font-size:18px;font-weight:700">${escapeHtml(input.greeting)}</p>${paragraphs}${action}</td></tr><tr><td style="padding:22px 34px;border-top:1px solid #3f1d1d;color:#8f7d70;font-size:12px;line-height:1.6">Rebels on Roads · Ride with discipline, ride with pride<br>Official contact: rebelsonroads@gmail.com</td></tr></table></td></tr></table></body></html>`;
}

export function registrationReceivedTemplate(name: string) {
  return brandedEmail({ eyebrow: "Application received", title: "Your rider application is under review", greeting: `Hello ${name},`, paragraphs: ["We have received your Rebels on Roads membership application.", "The road captain will verify your details and documents before approval. This message confirms receipt only; it is not a membership approval.", "You will receive a separate welcome email after the admin approves your application."], accent: "#f59e0b" });
}

export function riderApprovedTemplate(name: string, frontendUrl: string, remark?: string, whatsappUrl?: string, instagramUrl?: string) {
  const actions = [{label:"Explore upcoming rides",url:`${frontendUrl.replace(/\/$/, "")}/calendar`,style:"primary" as const},...(whatsappUrl?[{label:"Join WhatsApp group",url:whatsappUrl,style:"secondary" as const}]:[]),...(instagramUrl?[{label:"Follow on Instagram",url:instagramUrl,style:"secondary" as const}]:[])];
  return brandedEmail({ eyebrow: "Membership approved", title: "Welcome to Rebels on Roads", greeting: `Welcome aboard, ${name}!`, paragraphs: ["Your rider application has been approved. You are now cleared to join the Rebels on Roads community.", "Join the official channels below for ride briefings, assembly points, photographs and community updates.", ...(remark ? [`Admin note: ${remark}`] : [])], actions });
}

export function riderRejectedTemplate(name: string, remark?: string) { return brandedEmail({ eyebrow:"Application update",title:"Thank you for applying",greeting:`Hello ${name},`,paragraphs:["Thank you for your interest in Rebels on Roads. We are unable to approve your application at this time.",remark ? `Review note: ${remark}` : "You are welcome to try again in the future.","We appreciate the time and trust you placed in our community."],accent:"#ef4444" }); }
export function riderContactAgainTemplate(name: string, frontendUrl: string, remark?: string) { return brandedEmail({ eyebrow:"Information required",title:"Please update your application",greeting:`Hello ${name},`,paragraphs:["We need corrected or additional information before completing your application.",remark ? `What needs attention: ${remark}` : "Please submit a fresh application with the correct information."],actionLabel:"Apply again",actionUrl:`${frontendUrl.replace(/\/$/,"")}/join-group`,accent:"#f59e0b" }); }
export function riderPendingTemplate(name:string,remark?:string){return brandedEmail({eyebrow:"Review in progress",title:"Your application is pending",greeting:`Hello ${name},`,paragraphs:["Your Rebels on Roads application is currently pending further review.",...(remark?[`Admin note: ${remark}`]:[]),"We will contact you when the review is complete."],accent:"#f59e0b"})}
