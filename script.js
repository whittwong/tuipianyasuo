// ===================================
// 图片压缩工具 - 主逻辑
// ===================================

// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const controlSection = document.getElementById('controlSection');
const previewSection = document.getElementById('previewSection');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const compressionRatio = document.getElementById('compressionRatio');
const savedSpace = document.getElementById('savedSpace');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');

// 全局变量
let originalFile = null;
let compressedBlob = null;
let originalFileSize = 0;

// ===================================
// 文件上传相关事件
// ===================================

// 点击上传区域
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// 文件选择事件
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// 拖拽上传 - 阻止默认行为
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
});

// 拖拽放下事件
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        handleFile(file);
    }
});

// ===================================
// 文件处理函数
// ===================================

/**
 * 处理上传的文件
 * @param {File} file - 用户上传的图片文件
 */
function handleFile(file) {
    // 验证文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        showError('请上传PNG、JPG或JPEG格式的图片！');
        return;
    }
    
    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError('图片文件过大，请上传小于10MB的图片！');
        return;
    }
    
    // 隐藏错误提示
    hideError();
    
    // 保存原始文件
    originalFile = file;
    originalFileSize = file.size;
    
    // 显示原始图片
    displayOriginalImage(file);
    
    // 显示控制面板和预览区域
    controlSection.style.display = 'block';
    previewSection.style.display = 'block';
    
    // 压缩图片
    compressImage(file);
}

/**
 * 显示原始图片
 * @param {File} file - 图片文件
 */
function displayOriginalImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalSize.textContent = formatFileSize(originalFileSize);
    };
    
    reader.readAsDataURL(file);
}

// ===================================
// 图片压缩相关函数
// ===================================

/**
 * 压缩图片
 * @param {File} file - 要压缩的图片文件
 */
function compressImage(file) {
    const quality = qualitySlider.value / 100;
    
    // 创建图片对象
    const img = new Image();
    
    img.onload = () => {
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸为图片尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0);
        
        // 根据文件类型选择压缩方式
        let mimeType = 'image/jpeg';
        if (file.type === 'image/png') {
            mimeType = 'image/png';
        }
        
        // 压缩图片
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    compressedBlob = blob;
                    displayCompressedImage(blob);
                    updateStatistics(blob.size);
                } else {
                    showError('图片压缩失败，请重试！');
                }
            },
            mimeType,
            quality
        );
    };
    
    img.onerror = () => {
        showError('图片加载失败，请检查文件是否损坏！');
    };
    
    // 读取文件
    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * 显示压缩后的图片
 * @param {Blob} blob - 压缩后的图片Blob对象
 */
function displayCompressedImage(blob) {
    const url = URL.createObjectURL(blob);
    compressedImage.src = url;
    compressedImage.onload = () => {
        // 图片加载完成后释放URL
        URL.revokeObjectURL(url);
    };
}

// ===================================
// 压缩质量滑块事件
// ===================================

// 滑块值变化事件
qualitySlider.addEventListener('input', (e) => {
    const quality = e.target.value;
    qualityValue.textContent = quality + '%';
    
    // 如果已经有上传的图片，实时压缩
    if (originalFile) {
        compressImage(originalFile);
    }
});

// ===================================
// 统计信息更新
// ===================================

/**
 * 更新统计信息
 * @param {number} compressedSizeValue - 压缩后的文件大小（字节）
 */
function updateStatistics(compressedSizeValue) {
    // 更新压缩后的文件大小显示
    compressedSize.textContent = formatFileSize(compressedSizeValue);
    
    // 计算压缩比例
    const ratio = ((1 - compressedSizeValue / originalFileSize) * 100).toFixed(1);
    compressionRatio.textContent = ratio + '%';
    
    // 计算节省的空间
    const saved = originalFileSize - compressedSizeValue;
    savedSpace.textContent = formatFileSize(saved);
}

// ===================================
// 工具函数
// ===================================

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小字符串
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 KB';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 显示错误提示
 * @param {string} message - 错误消息
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        hideError();
    }, 3000);
}

/**
 * 隐藏错误提示
 */
function hideError() {
    errorMessage.style.display = 'none';
}

// ===================================
// 下载功能
// ===================================

/**
 * 下载压缩后的图片
 */
downloadBtn.addEventListener('click', () => {
    if (!compressedBlob) {
        showError('请先上传并压缩图片！');
        return;
    }
    
    // 创建下载链接
    const url = URL.createObjectURL(compressedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // 生成文件名
    const originalName = originalFile.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const extension = originalFile.type === 'image/png' ? '.png' : '.jpg';
    link.download = nameWithoutExt + '_compressed' + extension;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放URL
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
});

