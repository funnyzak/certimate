import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { produce } from "immer";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeployEditContext } from "./DeployEdit";

const DeployToSSH = () => {
  const { t } = useTranslation();

  const { deploy: data, setDeploy, error, setError } = useDeployEditContext();

  useEffect(() => {
    if (!data.id) {
      setDeploy({
        ...data,
        config: {
          format: "pem",
          certPath: "/etc/nginx/ssl/nginx.crt",
          keyPath: "/etc/nginx/ssl/nginx.key",
          pfxPassword: "",
          jksAlias: "",
          jksKeypass: "",
          jksStorepass: "",
          preCommand: "",
          command: "sudo service nginx reload",
        },
      });
    }
  }, []);

  useEffect(() => {
    setError({});
  }, []);

  const formSchema = z
    .object({
      format: z.union([z.literal("pem"), z.literal("pfx"), z.literal("jks")], {
        message: t("domain.deployment.form.file_format.placeholder"),
      }),
      certPath: z
        .string()
        .min(1, t("domain.deployment.form.file_cert_path.placeholder"))
        .max(255, t("common.errmsg.string_max", { max: 255 })),
      keyPath: z
        .string()
        .min(0, t("domain.deployment.form.file_key_path.placeholder"))
        .max(255, t("common.errmsg.string_max", { max: 255 })),
      pfxPassword: z.string().optional(),
      jksAlias: z.string().optional(),
      jksKeypass: z.string().optional(),
      jksStorepass: z.string().optional(),
      preCommand: z.string().optional(),
      command: z.string().optional(),
    })
    .refine((data) => (data.format === "pem" ? !!data.keyPath?.trim() : true), {
      message: t("domain.deployment.form.file_key_path.placeholder"),
      path: ["keyPath"],
    })
    .refine((data) => (data.format === "pfx" ? !!data.pfxPassword?.trim() : true), {
      message: t("domain.deployment.form.file_pfx_password.placeholder"),
      path: ["pfxPassword"],
    })
    .refine((data) => (data.format === "jks" ? !!data.jksAlias?.trim() : true), {
      message: t("domain.deployment.form.file_jks_alias.placeholder"),
      path: ["jksAlias"],
    })
    .refine((data) => (data.format === "jks" ? !!data.jksKeypass?.trim() : true), {
      message: t("domain.deployment.form.file_jks_keypass.placeholder"),
      path: ["jksKeypass"],
    })
    .refine((data) => (data.format === "jks" ? !!data.jksStorepass?.trim() : true), {
      message: t("domain.deployment.form.file_jks_storepass.placeholder"),
      path: ["jksStorepass"],
    });

  useEffect(() => {
    const res = formSchema.safeParse(data.config);
    if (!res.success) {
      setError({
        ...error,
        format: res.error.errors.find((e) => e.path[0] === "format")?.message,
        certPath: res.error.errors.find((e) => e.path[0] === "certPath")?.message,
        keyPath: res.error.errors.find((e) => e.path[0] === "keyPath")?.message,
        pfxPassword: res.error.errors.find((e) => e.path[0] === "pfxPassword")?.message,
        jksAlias: res.error.errors.find((e) => e.path[0] === "jksAlias")?.message,
        jksKeypass: res.error.errors.find((e) => e.path[0] === "jksKeypass")?.message,
        jksStorepass: res.error.errors.find((e) => e.path[0] === "jksStorepass")?.message,
        preCommand: res.error.errors.find((e) => e.path[0] === "preCommand")?.message,
        command: res.error.errors.find((e) => e.path[0] === "command")?.message,
      });
    } else {
      setError({
        ...error,
        format: undefined,
        certPath: undefined,
        keyPath: undefined,
        pfxPassword: undefined,
        jksAlias: undefined,
        jksKeypass: undefined,
        jksStorepass: undefined,
        preCommand: undefined,
        command: undefined,
      });
    }
  }, [data]);

  useEffect(() => {
    if (data.config?.format === "pem") {
      if (/(.pfx|.jks)$/.test(data.config.certPath)) {
        const newData = produce(data, (draft) => {
          draft.config ??= {};
          draft.config.certPath = data.config!.certPath.replace(/(.pfx|.jks)$/, ".crt");
        });
        setDeploy(newData);
      }
    } else if (data.config?.format === "pfx") {
      if (/(.crt|.jks)$/.test(data.config.certPath)) {
        const newData = produce(data, (draft) => {
          draft.config ??= {};
          draft.config.certPath = data.config!.certPath.replace(/(.crt|.jks)$/, ".pfx");
        });
        setDeploy(newData);
      }
    } else if (data.config?.format === "jks") {
      if (/(.crt|.pfx)$/.test(data.config.certPath)) {
        const newData = produce(data, (draft) => {
          draft.config ??= {};
          draft.config.certPath = data.config!.certPath.replace(/(.crt|.pfx)$/, ".jks");
        });
        setDeploy(newData);
      }
    }
  }, [data.config?.format]);

  return (
    <>
      <div className="flex flex-col space-y-8">
        <div>
          <Label>{t("domain.deployment.form.file_format.label")}</Label>
          <Select
            value={data?.config?.format}
            onValueChange={(value) => {
              const newData = produce(data, (draft) => {
                draft.config ??= {};
                draft.config.format = value;
              });
              setDeploy(newData);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("domain.deployment.form.file_format.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="pem">PEM</SelectItem>
                <SelectItem value="pfx">PFX</SelectItem>
                <SelectItem value="jks">JKS</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="text-red-600 text-sm mt-1">{error?.format}</div>
        </div>

        <div>
          <Label>{t("domain.deployment.form.file_cert_path.label")}</Label>
          <Input
            placeholder={t("domain.deployment.form.file_cert_path.label")}
            className="w-full mt-1"
            value={data?.config?.certPath}
            onChange={(e) => {
              const newData = produce(data, (draft) => {
                draft.config ??= {};
                draft.config.certPath = e.target.value?.trim();
              });
              setDeploy(newData);
            }}
          />
          <div className="text-red-600 text-sm mt-1">{error?.certPath}</div>
        </div>

        {data.config?.format === "pem" ? (
          <div>
            <Label>{t("domain.deployment.form.file_key_path.label")}</Label>
            <Input
              placeholder={t("domain.deployment.form.file_key_path.placeholder")}
              className="w-full mt-1"
              value={data?.config?.keyPath}
              onChange={(e) => {
                const newData = produce(data, (draft) => {
                  draft.config ??= {};
                  draft.config.keyPath = e.target.value?.trim();
                });
                setDeploy(newData);
              }}
            />
            <div className="text-red-600 text-sm mt-1">{error?.keyPath}</div>
          </div>
        ) : (
          <></>
        )}

        {data.config?.format === "pfx" ? (
          <div>
            <Label>{t("domain.deployment.form.file_pfx_password.label")}</Label>
            <Input
              placeholder={t("domain.deployment.form.file_pfx_password.placeholder")}
              className="w-full mt-1"
              value={data?.config?.pfxPassword}
              onChange={(e) => {
                const newData = produce(data, (draft) => {
                  draft.config ??= {};
                  draft.config.pfxPassword = e.target.value?.trim();
                });
                setDeploy(newData);
              }}
            />
            <div className="text-red-600 text-sm mt-1">{error?.pfxPassword}</div>
          </div>
        ) : (
          <></>
        )}

        {data.config?.format === "jks" ? (
          <>
            <div>
              <Label>{t("domain.deployment.form.file_jks_alias.label")}</Label>
              <Input
                placeholder={t("domain.deployment.form.file_jks_alias.placeholder")}
                className="w-full mt-1"
                value={data?.config?.jksAlias}
                onChange={(e) => {
                  const newData = produce(data, (draft) => {
                    draft.config ??= {};
                    draft.config.jksAlias = e.target.value?.trim();
                  });
                  setDeploy(newData);
                }}
              />
              <div className="text-red-600 text-sm mt-1">{error?.jksAlias}</div>
            </div>

            <div>
              <Label>{t("domain.deployment.form.file_jks_keypass.label")}</Label>
              <Input
                placeholder={t("domain.deployment.form.file_jks_keypass.placeholder")}
                className="w-full mt-1"
                value={data?.config?.jksKeypass}
                onChange={(e) => {
                  const newData = produce(data, (draft) => {
                    draft.config ??= {};
                    draft.config.jksKeypass = e.target.value?.trim();
                  });
                  setDeploy(newData);
                }}
              />
              <div className="text-red-600 text-sm mt-1">{error?.jksKeypass}</div>
            </div>

            <div>
              <Label>{t("domain.deployment.form.file_jks_storepass.label")}</Label>
              <Input
                placeholder={t("domain.deployment.form.file_jks_storepass.placeholder")}
                className="w-full mt-1"
                value={data?.config?.jksStorepass}
                onChange={(e) => {
                  const newData = produce(data, (draft) => {
                    draft.config ??= {};
                    draft.config.jksStorepass = e.target.value?.trim();
                  });
                  setDeploy(newData);
                }}
              />
              <div className="text-red-600 text-sm mt-1">{error?.jksStorepass}</div>
            </div>
          </>
        ) : (
          <></>
        )}

        <div>
          <Label>{t("domain.deployment.form.shell_pre_command.label")}</Label>
          <Textarea
            className="mt-1"
            value={data?.config?.preCommand}
            placeholder={t("domain.deployment.form.shell_pre_command.placeholder")}
            onChange={(e) => {
              const newData = produce(data, (draft) => {
                draft.config ??= {};
                draft.config.preCommand = e.target.value;
              });
              setDeploy(newData);
            }}
          ></Textarea>
          <div className="text-red-600 text-sm mt-1">{error?.preCommand}</div>
        </div>

        <div>
          <Label>{t("domain.deployment.form.shell_command.label")}</Label>
          <Textarea
            className="mt-1"
            value={data?.config?.command}
            placeholder={t("domain.deployment.form.shell_command.placeholder")}
            onChange={(e) => {
              const newData = produce(data, (draft) => {
                draft.config ??= {};
                draft.config.command = e.target.value;
              });
              setDeploy(newData);
            }}
          ></Textarea>
          <div className="text-red-600 text-sm mt-1">{error?.command}</div>
        </div>
      </div>
    </>
  );
};

export default DeployToSSH;
