import axios from 'axios';
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});
api.interceptors.request.use((config) => {//Tarayıcıdan Laravel'e giden her isteğin hemen öncesinde araya girer.
    const token = localStorage.getItem('token');//tarayıcı hafızasında kayıtlı bir token var mı diye bakar.
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;//eğer token bulursa elle yapıştırdığımız yetki anahtrını otmtk isteğin başlığına ekler.
    }
    return config;

});
export default api;//istek atıcımızı diğer react sayfalarında kullanabilmek için dışarı aktardık.