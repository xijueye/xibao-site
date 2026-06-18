/* ===== 企业门户交互引擎 v1.0 ===== */

// ===== 本地存储 =====
const DB = {
  get(key, def = []) {
    try { return JSON.parse(localStorage.getItem('portal_' + key)) || def; } catch { return def; }
  },
  set(key, val) { localStorage.setItem('portal_' + key, JSON.stringify(val)); },
  genId(prefix = 'ID') { return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase(); }
};

// ===== 弹窗系统 =====
const Modal = {
  show(title, bodyHtml, options = {}) {
    const id = 'modal-' + Date.now();
    const w = options.width || '640px';
    const modal = document.createElement('div');
    modal.id = id;
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);animation:fadeIn .2s';
    modal.innerHTML = `
      <div style="background:white;border-radius:12px;width:${w};max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:slideUp .25s">
        <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
          <h3 style="font-size:16px;color:#1f2937;margin:0">${title}</h3>
          <button onclick="Modal.close('${id}')" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;padding:4px 8px;border-radius:4px" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">&times;</button>
        </div>
        <div style="padding:20px;overflow-y:auto;flex:1">${bodyHtml}</div>
        ${options.footer ? `<div style="padding:12px 20px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">${options.footer}</div>` : ''}
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) Modal.close(id); });
    return id;
  },
  close(id) {
    const m = document.getElementById(id);
    if (m) { m.style.opacity = '0'; setTimeout(() => m.remove(), 200); }
  },
  confirm(msg, onOk) {
    const id = Modal.show('确认操作', `<p style="color:#4b5563;font-size:14px">${msg}</p>`, {
      footer: `<button onclick="Modal.close('${'modal-temp'}')" class="btn" style="background:#f3f4f6;color:#374151">取消</button><button class="btn btn-primary" id="modal-confirm-ok">确定</button>`,
      width: '420px'
    });
    setTimeout(() => {
      const btn = document.getElementById('modal-confirm-ok');
      if (btn) btn.onclick = () => { Modal.close(id); onOk(); };
      const cancelBtn = document.querySelector(`#${id} .btn`);
      if (cancelBtn) cancelBtn.onclick = () => Modal.close(id);
    }, 50);
  },
  toast(msg, type = 'success') {
    const t = document.createElement('div');
    const colors = { success: '#059669', error: '#dc2626', warning: '#d97706', info: '#0891b2' };
    t.style.cssText = `position:fixed;top:20px;right:20px;z-index:10000;padding:12px 20px;border-radius:8px;color:white;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideRight .3s;background:${colors[type] || colors.success}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500);
  }
};

// ===== 表单构建器 =====
const Form = {
  render(fields, values = {}) {
    return `<form id="dynamic-form" onsubmit="return false">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${fields.map(f => {
          const v = values[f.name] || f.default || '';
          const full = f.full ? 'grid-column:1/-1' : '';
          if (f.type === 'select') {
            return `<div style="${full}"><label style="display:block;font-size:13px;color:#4b5563;margin-bottom:6px;font-weight:500">${f.label}${f.required ? ' <span style="color:#dc2626">*</span>' : ''}</label>
              <select name="${f.name}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;background:white" ${f.required ? 'required' : ''}>
                <option value="">请选择</option>
                ${f.options.map(o => `<option value="${o}" ${o === v ? 'selected' : ''}>${o}</option>`).join('')}
              </select></div>`;
          }
          if (f.type === 'textarea') {
            return `<div style="${full}"><label style="display:block;font-size:13px;color:#4b5563;margin-bottom:6px;font-weight:500">${f.label}${f.required ? ' <span style="color:#dc2626">*</span>' : ''}</label>
              <textarea name="${f.name}" rows="3" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;resize:vertical" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}>${v}</textarea></div>`;
          }
          if (f.type === 'date') {
            return `<div style="${full}"><label style="display:block;font-size:13px;color:#4b5563;margin-bottom:6px;font-weight:500">${f.label}${f.required ? ' <span style="color:#dc2626">*</span>' : ''}</label>
              <input type="date" name="${f.name}" value="${v}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px" ${f.required ? 'required' : ''}></div>`;
          }
          return `<div style="${full}"><label style="display:block;font-size:13px;color:#4b5563;margin-bottom:6px;font-weight:500">${f.label}${f.required ? ' <span style="color:#dc2626">*</span>' : ''}</label>
            <input type="${f.type || 'text'}" name="${f.name}" value="${v}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}></div>`;
        }).join('')}
      </div>
    </form>`;
  },
  getData(formId = 'dynamic-form') {
    const form = document.getElementById(formId);
    if (!form) return null;
    const data = {};
    new FormData(form).forEach((v, k) => { if (v) data[k] = v; });
    return data;
  }
};

// ===== 审批引擎 =====
const Approval = {
  approve(id, storageKey, callback) {
    Modal.confirm('确认通过此审批？', () => {
      const list = DB.get(storageKey);
      const item = list.find(i => i.id === id);
      if (item) {
        item.status = '已通过';
        item.approvedAt = new Date().toLocaleString('zh-CN');
        item.approver = '席宝';
        DB.set(storageKey, list);
        Modal.toast('✅ 审批通过');
        if (callback) callback();
      }
    });
  },
  reject(id, storageKey, callback) {
    const html = `<div><label style="display:block;font-size:13px;color:#4b5563;margin-bottom:6px;font-weight:500">驳回原因 <span style="color:#dc2626">*</span></label>
      <textarea id="reject-reason" rows="3" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px" placeholder="请填写驳回原因..."></textarea></div>`;
    Modal.show('驳回审批', html, {
      width: '480px',
      footer: `<button class="btn" style="background:#f3f4f6;color:#374151" onclick="Modal.close(this.closest('[id^=modal]').id)">取消</button>
        <button class="btn btn-danger" onclick="Approval._doReject('${id}','${storageKey}')">确认驳回</button>`
    });
  },
  _doReject(id, storageKey) {
    const reason = document.getElementById('reject-reason')?.value;
    if (!reason) { Modal.toast('请填写驳回原因', 'warning'); return; }
    const list = DB.get(storageKey);
    const item = list.find(i => i.id === id);
    if (item) {
      item.status = '已驳回';
      item.rejectReason = reason;
      item.rejectedAt = new Date().toLocaleString('zh-CN');
      DB.set(storageKey, list);
      // Close all modals
      document.querySelectorAll('[id^=modal-]').forEach(m => m.remove());
      Modal.toast('❌ 已驳回', 'error');
      if (typeof renderTable === 'function') renderTable();
    }
  }
};

// ===== 数据汇总工具 =====
const Summary = {
  calc(list, field) {
    return list.reduce((s, i) => s + (parseFloat(i[field]) || 0), 0);
  },
  count(list, field, value) {
    return list.filter(i => i[field] === value).length;
  },
  group(list, field) {
    return list.reduce((g, i) => { (g[i[field]] = g[i[field]] || []).push(i); return g; }, {});
  },
  money(n) { return (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
};

// ===== 表格渲染工具 =====
const Table = {
  render(list, columns, options = {}) {
    if (!list.length) return '<div style="padding:40px;text-align:center;color:#9ca3af">暂无数据</div>';
    return `<table><thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${list.map(row => `<tr>${columns.map(c => {
        if (c.render) return `<td>${c.render(row[c.key], row)}</td>`;
        return `<td>${row[c.key] || '-'}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table>`;
  },
  pagination(total, page, pageSize = 10) {
    const pages = Math.ceil(total / pageSize);
    if (pages <= 1) return '';
    let html = '<div style="padding:16px;display:flex;justify-content:center;gap:8px;align-items:center">';
    for (let i = 1; i <= pages; i++) {
      html += `<button onclick="goPage(${i})" style="padding:6px 12px;border:1px solid ${i === page ? '#1a56db' : '#d1d5db'};background:${i === page ? '#1a56db' : 'white'};color:${i === page ? 'white' : '#4b5563'};border-radius:6px;cursor:pointer;font-size:13px">${i}</button>`;
    }
    html += `<span style="font-size:13px;color:#9ca3af;margin-left:8px">共 ${total} 条</span></div>`;
    return html;
  }
};

// ===== 通用初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  // 注入动画样式
  if (!document.getElementById('modal-animations')) {
    const style = document.createElement('style');
    style.id = 'modal-animations';
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes slideRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
  }
});

console.log('🏢 企业门户交互引擎 v1.0 已加载');
