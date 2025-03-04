const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * 데이터 디렉토리가 존재하는지 확인하고 없으면 생성합니다.
 */
const ensureDataDir = () => {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
};

/**
 * 파일이 존재하는지 확인합니다.
 * @param {string} filePath - 확인할 파일 경로
 * @returns {boolean} 파일 존재 여부
 */
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * 파일을 읽어 JSON으로 파싱합니다.
 * @param {string} filePath - 읽을 파일 경로
 * @returns {Object|null} 파싱된 JSON 객체 또는 오류 시 null
 */
const readJsonFile = (filePath) => {
  try {
    if (!fileExists(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`파일 읽기 오류 (${filePath}):`, error);
    return null;
  }
};

/**
 * JSON 데이터를 파일에 저장합니다.
 * @param {string} filePath - 저장할 파일 경로
 * @param {Object} data - 저장할 JSON 데이터
 * @returns {boolean} 저장 성공 여부
 */
const writeJsonFile = (filePath, data) => {
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`파일 쓰기 오류 (${filePath}):`, error);
    return false;
  }
};

/**
 * 파일을 삭제합니다.
 * @param {string} filePath - 삭제할 파일 경로
 * @returns {boolean} 삭제 성공 여부
 */
const deleteFile = (filePath) => {
  try {
    if (!fileExists(filePath)) {
      return false;
    }
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`파일 삭제 오류 (${filePath}):`, error);
    return false;
  }
};

/**
 * 디렉토리 내의 모든 파일 목록을 가져옵니다.
 * @param {string} dirPath - 디렉토리 경로
 * @param {string} extension - 필터링할 파일 확장자 (예: '.json')
 * @returns {string[]} 파일 경로 배열
 */
const getFilesInDir = (dirPath, extension = '') => {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    return fs.readdirSync(dirPath)
      .filter(file => file.endsWith(extension))
      .map(file => path.join(dirPath, file));
  } catch (error) {
    console.error(`디렉토리 읽기 오류 (${dirPath}):`, error);
    return [];
  }
};

module.exports = {
  ensureDataDir,
  fileExists,
  readJsonFile,
  writeJsonFile,
  deleteFile,
  getFilesInDir
}; 