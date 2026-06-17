import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./Layout";

import Root from "./Root";
import Login from "./Login";
import CheckEmail from "./CheckEmail";
import ConfirmEmail from "./ConfirmEmail";
import Registration from "./Registration";
import AuthCallback from "./AuthCallback";
import ErrorCallback from "./ErrorCallback";
import ResetPassword from "./ResetPassword";
import ForgotPassword from "./ForgotPassword";
import AcceptInvitation from "./AcceptInvitation";
import ReviewInvitation from "./ReviewInvitation";
import Authorize from "./Authorize/Authorize";
import AuthorizeLayout from "./AuthorizeLayout/AuthorizeLayout";
import OauthCallback from "./OauthCallback";

const Auth = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Root />}></Route>
        <Route path="login" element={<Login />}></Route>
        <Route path="check" element={<CheckEmail />}></Route>
        <Route path="error" element={<ErrorCallback />}></Route>
        <Route path="check-email" element={<AuthCallback />}></Route>
        <Route path="registration" element={<Registration />}></Route>
        <Route path="confirm-email" element={<ConfirmEmail />}></Route>
        <Route path="reset-password" element={<ResetPassword />}></Route>
        <Route path="forgot-password" element={<ForgotPassword />}></Route>
        <Route path="accept-invitation" element={<AcceptInvitation />}></Route>
        <Route path="review-invitation" element={<ReviewInvitation />}></Route>
        <Route path="*" element={<Navigate to="/" />}></Route>
      </Route>

      <Route path="authorize" element={<AuthorizeLayout />}>
        <Route index element={<Authorize />} />
        <Route path="oauth/callback" element={<OauthCallback />} />
      </Route>
    </Routes>
  );
};

export default Auth;
